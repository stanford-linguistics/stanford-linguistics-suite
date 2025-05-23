# -*- coding: utf-8 -*-
from __future__ import division, absolute_import, print_function
import redis
import json
import time
import logging
import sys
import os

# Python 2/3 compatibility
if sys.version_info[0] >= 3:
    unicode = str

logger = logging.getLogger(__name__)

# Feature flag check
def is_redis_enabled():
    """Check if Redis state tracking is enabled via feature flag."""
    return os.environ.get('REDIS_STATE_TRACKING_ENABLED', 'true').lower() in ('true', '1', 'yes', 'on')

class RedisStateManager(object):
    """
    Manages task state in Redis with Python 2.7 compatibility.
    Provides a centralized, persistent state store that survives worker restarts.
    """
    
    def __init__(self, redis_url=None):
        """
        Initialize Redis connection using database 1 for state tracking.
        Database 0 is reserved for Celery broker.
        
        Args:
            redis_url: Redis URL (defaults to redis://redis:6379/1)
        """
        self.enabled = is_redis_enabled()
        
        if not self.enabled:
            logger.info("Redis state tracking is disabled via feature flag")
            self.redis_client = None
            self.key_prefix = 'task_state'
            self.ttl = 86400 * 7  # 7 days TTL for task states
            return
            
        if redis_url is None:
            redis_url = os.environ.get('REDIS_STATE_URL', 'redis://redis:6379/1')
        
        try:
            self.redis_client = redis.StrictRedis.from_url(redis_url)
            # Test connection
            self.redis_client.ping()
            logger.info("Connected to Redis for state tracking: %s", redis_url)
        except Exception as e:
            logger.error("Failed to connect to Redis: %s", str(e))
            self.redis_client = None
            
        self.key_prefix = 'task_state'
        self.ttl = 86400 * 7  # 7 days TTL for task states
        
    def _get_key(self, task_id):
        """Generate Redis key for task state."""
        return '{0}:{1}'.format(self.key_prefix, task_id)
    
    def set_task_state(self, task_id, state, metadata=None):
        """
        Set task state in Redis with TTL.
        
        Args:
            task_id: Task ID
            state: Task state (pending, running, success, failure)
            metadata: Optional metadata dict
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.redis_client:
            logger.warning("Redis client not available, skipping state update")
            return False
            
        key = self._get_key(task_id)
        data = {
            'task_id': task_id,
            'state': state,
            'timestamp': int(time.time()),
            'metadata': metadata or {}
        }
        
        try:
            self.redis_client.setex(
                key, 
                self.ttl,
                json.dumps(data)
            )
            logger.info("Set Redis state for task %s: %s", task_id, state)
            return True
        except Exception as e:
            logger.error("Failed to set Redis state: %s", str(e))
            return False
    
    def get_task_state(self, task_id):
        """
        Get task state from Redis.
        
        Args:
            task_id: Task ID
            
        Returns:
            dict: Task state data or None if not found
        """
        if not self.redis_client:
            return None
            
        key = self._get_key(task_id)
        
        try:
            data = self.redis_client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error("Failed to get Redis state: %s", str(e))
            return None
    
    def update_task_progress(self, task_id, stage, stage_info=None):
        """
        Update task progress information.
        
        Args:
            task_id: Task ID
            stage: Current processing stage
            stage_info: Optional stage details
            
        Returns:
            bool: True if successful, False otherwise
        """
        current_state = self.get_task_state(task_id)
        if not current_state:
            current_state = {'state': 'running', 'metadata': {}}
        
        current_state['metadata']['stage'] = stage
        if stage_info:
            current_state['metadata']['stage_info'] = stage_info
        current_state['metadata']['last_update'] = int(time.time())
        
        return self.set_task_state(
            task_id, 
            current_state['state'], 
            current_state['metadata']
        )
    
    def mark_task_completed(self, task_id, result_summary=None):
        """
        Mark task as successfully completed.
        
        Args:
            task_id: Task ID
            result_summary: Optional result summary
            
        Returns:
            bool: True if successful, False otherwise
        """
        metadata = {
            'completed_at': int(time.time()),
            'result_summary': result_summary
        }
        return self.set_task_state(task_id, 'success', metadata)
    
    def mark_task_failed(self, task_id, error_info=None):
        """
        Mark task as failed.
        
        Args:
            task_id: Task ID
            error_info: Error information
            
        Returns:
            bool: True if successful, False otherwise
        """
        metadata = {
            'failed_at': int(time.time()),
            'error': str(error_info) if error_info else "Unknown error"
        }
        return self.set_task_state(task_id, 'failure', metadata)
    
    def delete_task_state(self, task_id):
        """
        Delete task state from Redis.
        
        Args:
            task_id: Task ID
            
        Returns:
            bool: True if deleted, False otherwise
        """
        if not self.redis_client:
            return False
            
        key = self._get_key(task_id)
        
        try:
            result = self.redis_client.delete(key)
            if result > 0:
                logger.info("Deleted Redis state for task %s", task_id)
                return True
            return False
        except Exception as e:
            logger.error("Failed to delete Redis state: %s", str(e))
            return False
    
    def get_all_task_states(self, pattern=None):
        """
        Get all task states matching a pattern.
        
        Args:
            pattern: Optional pattern to match (e.g., for specific task types)
            
        Returns:
            list: List of task state dictionaries
        """
        if not self.redis_client:
            return []
            
        search_pattern = '{0}:*'.format(self.key_prefix)
        if pattern:
            search_pattern = '{0}:{1}'.format(self.key_prefix, pattern)
        
        try:
            keys = self.redis_client.keys(search_pattern)
            states = []
            
            for key in keys:
                data = self.redis_client.get(key)
                if data:
                    try:
                        states.append(json.loads(data))
                    except (ValueError, TypeError):
                        logger.warning("Failed to decode state data for key: %s", key)
            
            return states
        except Exception as e:
            logger.error("Failed to get all task states: %s", str(e))
            return []
    
    def get_state_statistics(self):
        """
        Get statistics about task states.
        
        Returns:
            dict: Statistics about task states
        """
        all_states = self.get_all_task_states()
        
        stats = {
            'total': len(all_states),
            'by_state': {},
            'by_type': {}
        }
        
        for state_data in all_states:
            state = state_data.get('state', 'unknown')
            task_type = state_data.get('metadata', {}).get('task_type', 'unknown')
            
            stats['by_state'][state] = stats['by_state'].get(state, 0) + 1
            stats['by_type'][task_type] = stats['by_type'].get(task_type, 0) + 1
        
        return stats

# Create a singleton instance
_redis_state_manager = None

def get_redis_state_manager():
    """Get or create the singleton Redis state manager instance."""
    global _redis_state_manager
    if _redis_state_manager is None:
        _redis_state_manager = RedisStateManager()
    return _redis_state_manager
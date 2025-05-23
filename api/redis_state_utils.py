"""Redis-based task state utilities for Flask API."""
import redis
import json
import logging
import os
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# Feature flag check
def is_redis_enabled():
    """Check if Redis state tracking is enabled via feature flag."""
    try:
        from config import get_config
        config = get_config()
        return config.is_redis_state_tracking_enabled()
    except ImportError:
        # If config is not available, check environment variable directly
        return os.environ.get('REDIS_STATE_TRACKING_ENABLED', 'true').lower() in ('true', '1', 'yes', 'on')

class RedisStateClient:
    """Client for accessing task states in Redis."""
    
    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize Redis client for state tracking.
        
        Args:
            redis_url: Redis URL (defaults to redis://redis:6379/1)
        """
        self.enabled = is_redis_enabled()
        
        if not self.enabled:
            logger.info("Redis state tracking is disabled via feature flag")
            self.redis_client = None
            self.key_prefix = 'task_state'
            return
            
        if redis_url is None:
            redis_url = os.environ.get('REDIS_STATE_URL', 'redis://redis:6379/1')
        
        try:
            self.redis_client = redis.StrictRedis.from_url(redis_url)
            # Test connection
            self.redis_client.ping()
            logger.info(f"Connected to Redis for state tracking: {redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
            
        self.key_prefix = 'task_state'
    
    def get_task_state(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get task state from Redis.
        
        Args:
            task_id: Task ID to retrieve
            
        Returns:
            Task state dictionary or None if not found
        """
        if not self.redis_client:
            return None
            
        key = f"{self.key_prefix}:{task_id}"
        
        try:
            data = self.redis_client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to get Redis state for {task_id}: {e}")
            return None
    
    def get_all_task_states(self, pattern: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all task states matching a pattern.
        
        Args:
            pattern: Optional pattern to match task IDs
            
        Returns:
            List of task state dictionaries
        """
        if not self.redis_client:
            return []
        
        search_pattern = f"{self.key_prefix}:*"
        if pattern:
            search_pattern = f"{self.key_prefix}:{pattern}"
        
        try:
            keys = self.redis_client.keys(search_pattern)
            states = []
            
            for key in keys:
                data = self.redis_client.get(key)
                if data:
                    try:
                        states.append(json.loads(data))
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to decode state data for key: {key}")
            
            return states
        except Exception as e:
            logger.error(f"Failed to get all task states: {e}")
            return []
    
    def get_state_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about task states.
        
        Returns:
            Dictionary with state statistics
        """
        all_states = self.get_all_task_states()
        
        stats = {
            'total': len(all_states),
            'by_state': {},
            'by_type': {},
            'active_tasks': 0,
            'completed_tasks': 0,
            'failed_tasks': 0
        }
        
        for state_data in all_states:
            state = state_data.get('state', 'unknown')
            task_type = state_data.get('metadata', {}).get('task_type', 'unknown')
            
            # Count by state
            stats['by_state'][state] = stats['by_state'].get(state, 0) + 1
            
            # Count by type
            stats['by_type'][task_type] = stats['by_type'].get(task_type, 0) + 1
            
            # Count active/completed/failed
            if state in ('pending', 'running'):
                stats['active_tasks'] += 1
            elif state == 'success':
                stats['completed_tasks'] += 1
            elif state == 'failure':
                stats['failed_tasks'] += 1
        
        return stats
    
    def delete_task_state(self, task_id: str) -> bool:
        """
        Delete task state from Redis.
        
        Args:
            task_id: Task ID to delete
            
        Returns:
            True if deleted, False otherwise
        """
        if not self.redis_client:
            return False
            
        key = f"{self.key_prefix}:{task_id}"
        
        try:
            result = self.redis_client.delete(key)
            if result > 0:
                logger.info(f"Deleted Redis state for task {task_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete Redis state: {e}")
            return False
    
    def cleanup_old_states(self, days: int = 30) -> int:
        """
        Clean up task states older than specified days.
        
        Args:
            days: Number of days to keep states
            
        Returns:
            Number of states cleaned up
        """
        if not self.redis_client:
            return 0
        
        import time
        cutoff_timestamp = int(time.time()) - (days * 86400)
        cleaned = 0
        
        all_states = self.get_all_task_states()
        for state_data in all_states:
            timestamp = state_data.get('timestamp', 0)
            if timestamp < cutoff_timestamp:
                task_id = state_data.get('task_id')
                if task_id and self.delete_task_state(task_id):
                    cleaned += 1
        
        logger.info(f"Cleaned up {cleaned} old task states")
        return cleaned

# Initialize global Redis client
redis_state_client = RedisStateClient()

def get_enhanced_task_state(task_id: str, celery_state: str) -> Dict[str, Any]:
    """
    Get task state with Redis as the primary source.
    
    This function checks Redis first for the most up-to-date state,
    then falls back to the existing file-based state resolution.
    
    Args:
        task_id: Task ID to check
        celery_state: State reported by Celery
        
    Returns:
        Enhanced state information dictionary
    """
    # Check Redis first - most authoritative for active tasks
    redis_state = redis_state_client.get_task_state(task_id)
    
    if redis_state:
        state = redis_state.get('state')
        
        # For completed or failed tasks in Redis, trust Redis completely
        if state in ('success', 'failure'):
            logger.info(f"Task {task_id}: Found definitive state in Redis: {state}")
            return {
                'state': state,
                'source': 'redis',
                'reliable': True,
                'metadata': redis_state.get('metadata', {}),
                'timestamp': redis_state.get('timestamp')
            }
        
        # For running tasks, Redis provides the most current progress
        elif state == 'running':
            metadata = redis_state.get('metadata', {})
            return {
                'state': 'running',
                'source': 'redis',
                'reliable': True,
                'stage': metadata.get('stage'),
                'stage_info': metadata.get('stage_info'),
                'last_update': metadata.get('last_update'),
                'timestamp': redis_state.get('timestamp')
            }
    
    # If Redis doesn't have the state or it's not definitive,
    # fall back to file-based state resolution
    # This will be handled by the existing task_state_utils.get_reliable_task_state
    return None
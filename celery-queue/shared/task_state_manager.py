# -*- coding: utf-8 -*-
from __future__ import division, absolute_import
import os
import io
import json
import time
import logging
import sys

# Python 2/3 compatibility for unicode
if sys.version_info[0] >= 3:
    unicode = str

from shared.results_helper import get_output_path

# Configure logging
logger = logging.getLogger(__name__)

# Constants
PUBLIC_FOLDER = '/public'

def ensure_directory(directory):
    """
    Create a directory if it doesn't exist.
    Python 2.7 compatible implementation.
    
    Args:
        directory: Directory path to create
    """
    try:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logger.info("Created directory: %s", directory)
    except OSError as e:
        logger.error("Failed to create directory: %s - %s", directory, str(e))
        raise

def write_task_state(folder_id, state, metadata=None):
    """
    Write task state to a JSON file for persistent state tracking.
    Python 2.7 compatible implementation.
    
    Args:
        folder_id: The task ID
        state: Task state string ("pending", "running", "success", "failure")
        metadata: Optional dict with additional state information
        
    Returns:
        bool: True if successful, False otherwise
    """
    output_dir = get_output_path(folder_id)
    ensure_directory(output_dir)
    
    state_file = os.path.join(output_dir, 'task_state.json')
    
    data = {
        'task_id': folder_id,
        'state': state,
        'timestamp': int(time.time()),
        'worker_pid': os.getpid()
    }
    
    # Add any additional metadata
    if metadata:
        data.update(metadata)
    
    try:
        with io.open(state_file, 'w', encoding='utf-8') as f:
            json_str = json.dumps(data, indent=2, ensure_ascii=False)
            f.write(unicode(json_str))  # noqa: F821
        
        logger.info("Task state file written: %s, state: %s", state_file, state)
        return True
    except Exception as e:
        logger.error("Failed to write task state file: %s", str(e))
        return False

def mark_task_started(folder_id, metadata=None):
    """
    Mark a task as started in a persistent state file.
    Python 2.7 compatible implementation.
    
    Args:
        folder_id: Task ID
        metadata: Optional metadata dict
        
    Returns:
        bool: True if successful, False otherwise
    """
    return write_task_state(folder_id, 'running', metadata)

def mark_task_successful(folder_id, result_data=None):
    """
    Mark a task as successfully completed with durable markers.
    Python 2.7 compatible implementation.
    
    Args:
        folder_id: Task ID
        result_data: Optional result data
        
    Returns:
        bool: True if successful, False otherwise
    """
    metadata = {
        'completed_at': int(time.time()),
        'result_summary': result_data
    }
    # Create main state file
    write_task_state(folder_id, 'success', metadata)
    
    # Create explicit success marker file that's just a simple flag file
    # This is deliberately separate from the detailed state file for robustness
    output_dir = get_output_path(folder_id)
    success_marker = os.path.join(output_dir, 'task_completed')
    try:
        with io.open(success_marker, 'w', encoding='utf-8') as f:
            f.write(unicode('success'))
        logger.info("Task success marker created: %s", success_marker)
        return True
    except Exception as e:
        logger.error("Failed to write success marker: %s", str(e))
        return False

def mark_task_failed(folder_id, error_info=None):
    """
    Mark a task as failed with error details.
    Python 2.7 compatible implementation.
    
    Args:
        folder_id: Task ID
        error_info: Error information
        
    Returns:
        bool: True if successful, False otherwise
    """
    metadata = {
        'failed_at': int(time.time()),
        'error': str(error_info) if error_info else "Unknown error"
    }
    return write_task_state(folder_id, 'failure', metadata)

def read_task_state(folder_id):
    """
    Read the current task state from the state file.
    Python 2.7 compatible implementation.
    
    Args:
        folder_id: Task ID
        
    Returns:
        dict: Task state data or None if not found
    """
    output_dir = get_output_path(folder_id)
    state_file = os.path.join(output_dir, 'task_state.json')
    
    if not os.path.exists(state_file):
        return None
        
    try:
        with io.open(state_file, 'r', encoding='utf-8') as f:
            return json.loads(f.read())
    except Exception as e:
        logger.error("Failed to read task state file: %s", str(e))
        return None

def get_reliable_task_state(folder_id, celery_state):
    """
    Determine the most reliable task state from multiple sources.
    Python 2.7 compatible implementation.
    
    Args:
        folder_id: Task ID
        celery_state: State reported by Celery AsyncResult
        
    Returns:
        Dictionary with resolved state and metadata
    """
    output_dir = get_output_path(folder_id)
    state_file = os.path.join(output_dir, 'task_state.json')
    success_marker = os.path.join(output_dir, 'task_completed')
    results_file = os.path.join(output_dir, 'results.csv')
    json_result = os.path.join(PUBLIC_FOLDER, folder_id, 'results.json')
    
    logger.info("Checking reliable state for task %s (Celery reports: %s)", 
               folder_id, celery_state)
    
    # Check for success marker (most definitive)
    if os.path.exists(success_marker):
        logger.info("Task %s: Success marker found", folder_id)
        return {
            'state': 'success',
            'source': 'success_marker',
            'reliable': True
        }
    
    # Check for results files
    results_exist = os.path.exists(results_file)
    json_exists = os.path.exists(json_result)
    
    if results_exist and json_exists:
        logger.info("Task %s: Result files exist - CSV: %s, JSON: %s", 
                   folder_id, results_exist, json_exists)
        return {
            'state': 'success', 
            'source': 'result_files',
            'reliable': True
        }
    
    # Check state file
    if os.path.exists(state_file):
        try:
            with io.open(state_file, 'r', encoding='utf-8') as f:
                state_data = json.loads(f.read())
                # If state file indicates success or failure, trust it
                if state_data.get('state') in ('success', 'failure'):
                    logger.info("Task %s: State file indicates %s", 
                               folder_id, state_data.get('state'))
                    return {
                        'state': state_data.get('state'),
                        'source': 'state_file',
                        'reliable': True,
                        'metadata': state_data
                    }
                else:
                    logger.info("Task %s: State file indicates %s, but not definitive", 
                               folder_id, state_data.get('state'))
        except Exception as e:
            logger.warning("Failed to read task state file: %s", str(e))
    
    # If we're in PENDING but have a directory, this is likely a restart
    result_dir_exists = os.path.exists(output_dir)
    if celery_state.upper() == 'PENDING' and result_dir_exists:
        logger.info("Task %s: Celery reports PENDING but task directory exists, likely a worker restart", folder_id)
        # Check if we see partial results
        if os.path.exists(os.path.join(output_dir, 'raw_results.csv')):
            return {
                'state': 'interrupted',
                'source': 'directory_analysis',
                'reliable': True,
                'message': 'Task was interrupted, likely by a worker restart'
            }
    
    # If we got this far, rely on Celery state with less confidence
    logger.info("Task %s: Falling back to Celery state: %s", folder_id, celery_state)
    return {
        'state': celery_state.lower(),
        'source': 'celery',
        'reliable': False
    }

def sync_state_to_celery(folder_id, celery_app):
    """
    Attempt to synchronize our persisted state with Celery's state.
    Python 2.7 compatible implementation.
    Only called at worker startup or when inconsistencies are detected.
    
    Args:
        folder_id: Task ID
        celery_app: Celery app instance
        
    Returns:
        bool: True if state was synchronized, False otherwise
    """
    # This is a placeholder for future implementation
    # It would require deeper integration with Celery's internals
    # to truly rebuild task state after a restart
    return False

"""
Task State Utilities for Flask API

These utilities help determine the most reliable task state by checking multiple sources,
providing resilience against Celery worker container restarts.
"""
import os
import json
import logging
from typing import Dict, Any, Optional, Tuple
from redis_state_utils import redis_state_client, get_enhanced_task_state

# Configure logging
logger = logging.getLogger(__name__)

# Constants
PUBLIC_FOLDER = '/public'
RESULTS_FOLDER = '/results'


def get_output_path(folder_id: str) -> str:
    """Get the path to a task's output directory."""
    return os.path.join(RESULTS_FOLDER, folder_id, 'output')


def get_reliable_task_state(task_id: str, celery_state: str) -> Dict[str, Any]:
    """
    Determine the most reliable task state from multiple sources.
    
    This function checks multiple state indicators to determine the actual state of a task,
    which is especially important after Celery worker restarts where Celery may report
    a task as PENDING even if it was previously successful.
    
    Args:
        task_id: Task ID to check
        celery_state: State reported by Celery AsyncResult
        
    Returns:
        Dictionary with resolved state and metadata
    """
    # First check Redis for the most up-to-date state
    redis_state = get_enhanced_task_state(task_id, celery_state)
    if redis_state:
        logger.info(f"Task {task_id}: Found state in Redis: {redis_state.get('state')}")
        return redis_state
    
    # If Redis doesn't have definitive state, continue with file-based checks
    output_dir = get_output_path(task_id)
    state_file = os.path.join(output_dir, 'task_state.json')
    success_marker = os.path.join(output_dir, 'task_completed')
    results_file = os.path.join(output_dir, 'results.csv')
    json_result = os.path.join(PUBLIC_FOLDER, task_id, 'results.json')
    
    logger.info(f"Checking reliable state for task {task_id} (Celery reports: {celery_state})")
    
    # Check for success marker (most definitive)
    if os.path.exists(success_marker):
        logger.info(f"Task {task_id}: Success marker found")
        return {
            'state': 'success',
            'source': 'success_marker',
            'reliable': True
        }
    
    # Check for results files
    results_exist = os.path.exists(results_file)
    json_exists = os.path.exists(json_result)
    
    if results_exist and json_exists:
        logger.info(f"Task {task_id}: Result files exist - CSV: {results_exist}, JSON: {json_exists}")
        return {
            'state': 'success', 
            'source': 'result_files',
            'reliable': True
        }
    
    # Check state file
    if os.path.exists(state_file):
        try:
            with open(state_file, 'r', encoding='utf-8') as f:
                state_data = json.loads(f.read())
                # If state file indicates success or failure, trust it
                if state_data.get('state') in ('success', 'failure'):
                    logger.info(f"Task {task_id}: State file indicates {state_data.get('state')}")
                    return {
                        'state': state_data.get('state'),
                        'source': 'state_file',
                        'reliable': True,
                        'metadata': state_data
                    }
                else:
                    logger.info(f"Task {task_id}: State file indicates {state_data.get('state')}, but not definitive")
                    # For tasks in progress, return the more specific state from the state file
                    state = state_data.get('state')
                    
                    # Special handling for packaging state
                    if state == 'packaging':
                        logger.info(f"Task {task_id}: In packaging phase, treating as still running")
                        return {
                            'state': 'packaging',  # Keep original state for normalization
                            'stage': 'packaging',
                            'stage_info': 'Finalizing results and creating zip archive',
                            'source': 'state_file',
                            'reliable': True,
                            'timestamp': state_data.get('timestamp', 0)
                        }
                    else:
                        return {
                            'state': 'running', 
                            'stage': state,
                            'stage_info': state_data.get('stage', None),
                            'source': 'state_file',
                            'reliable': True,
                            'timestamp': state_data.get('timestamp', 0)
                        }
        except Exception as e:
            logger.warning(f"Failed to read task state file: {e}")
    
    # Enhanced check for tasks that Celery reports as PENDING but might be completed
    result_dir_exists = os.path.exists(output_dir)
    public_dir = os.path.join(PUBLIC_FOLDER, task_id)
    public_dir_exists = os.path.exists(public_dir)
    
    if celery_state.upper() == 'PENDING' and (result_dir_exists or public_dir_exists):
        logger.info(f"Task {task_id}: Celery reports PENDING but task directories exist, investigating true state")
        
        # Check for ZIP file in results folder - strong indicator of completion
        results_folder = os.path.join(RESULTS_FOLDER, task_id)
        has_zip = any(f.endswith('.zip') for f in os.listdir(results_folder)) if os.path.exists(results_folder) else False
        
        # Check for results.json in public folder - another strong indicator
        has_json_result = os.path.exists(json_result)
        
        # Check for raw_results.csv - indicates processing started but might not have completed
        has_raw_results = os.path.exists(os.path.join(output_dir, 'raw_results.csv'))
        
        # Check for additional result artifacts
        has_results_csv = os.path.exists(results_file)
        has_sentences_csv = os.path.exists(os.path.join(output_dir, 'sentences.csv'))
        has_analysis_json = os.path.exists(os.path.join(output_dir, 'analysis_summary.json'))
        
        # Log all evidence for debugging
        logger.info(f"Task {task_id} evidence: zip={has_zip}, json={has_json_result}, raw={has_raw_results}, "
                   f"results.csv={has_results_csv}, sentences.csv={has_sentences_csv}, analysis.json={has_analysis_json}")
        
        # Decision tree for determining true state
        if has_zip or (has_json_result and has_results_csv):
            # Strong evidence of successful completion
            logger.info(f"Task {task_id}: Found strong evidence of successful completion despite PENDING state")
            return {
                'state': 'success',
                'source': 'artifact_analysis',
                'reliable': True,
                'artifacts': {
                    'has_zip': has_zip,
                    'has_json': has_json_result,
                    'has_results_csv': has_results_csv
                }
            }
        elif has_results_csv and (has_sentences_csv or has_analysis_json):
            # Moderately strong evidence - has key result files but maybe not packaged
            logger.info(f"Task {task_id}: Found results artifacts but no zip/json, likely successful")
            return {
                'state': 'success',
                'source': 'partial_artifact_analysis',
                'reliable': True,
                'message': 'Task appears to have completed but packaging may have been interrupted'
            }
        elif has_raw_results:
            # Has started processing but didn't fully complete
            logger.info(f"Task {task_id}: Found raw results but missing final outputs, likely interrupted")
            return {
                'state': 'interrupted',
                'source': 'directory_analysis',
                'reliable': True,
                'message': 'Task was interrupted, likely by a worker restart'
            }
    
    # If we got this far, rely on Celery state with less confidence
    logger.info(f"Task {task_id}: Falling back to Celery state: {celery_state}")
    return {
        'state': celery_state.lower(),
        'source': 'celery',
        'reliable': False
    }


def resolve_task_state(task_id: str, celery_state: str) -> Tuple[str, Dict[str, Any]]:
    """
    Resolve the most reliable task state and return it in a normalized form.
    
    Args:
        task_id: Task ID to check
        celery_state: State reported by Celery AsyncResult
        
    Returns:
        Tuple of (normalized_state, state_info) where normalized_state is one of:
        'pending', 'running', 'success', 'failure', 'expired', 'revoked'
    """
    # First check if we have any persistent evidence of task completion
    results_dir = os.path.join(RESULTS_FOLDER, task_id)
    public_dir = os.path.join(PUBLIC_FOLDER, task_id)
    json_result = os.path.join(public_dir, 'results.json')
    
    # Strong indicators of previous success regardless of what Celery reports
    if os.path.exists(json_result):
        logger.info(f"Task {task_id}: Found results.json - task was definitely successful despite Celery reporting {celery_state}")
        # Create a reliable state info dict indicating success
        state_info = {
            'state': 'success',
            'source': 'results_json_existence',
            'reliable': True,
            'override_reason': f"Found results.json despite Celery reporting {celery_state}"
        }
        return 'success', state_info
    
    # If no strong evidence override, proceed with normal resolution
    state_info = get_reliable_task_state(task_id, celery_state)
    raw_state = state_info.get('state', celery_state).lower()
    
    # Normalize raw state to one of our standard states
    if raw_state in ('success', 'successful'):
        return 'success', state_info
    elif raw_state in ('failure', 'failed'):
        return 'failure', state_info
    elif raw_state in ('pending', 'waiting'):
        return 'pending', state_info
    elif raw_state in ('running', 'started', 'processing', 'enhancing', 'verifying', 'packaging'):
        # For packaging state, preserve the original state in state_info for more detailed status reporting
        if raw_state == 'packaging':
            state_info['stage'] = 'packaging'
            state_info['stage_info'] = 'Finalizing results and creating zip archive'
        return 'running', state_info
    elif raw_state == 'revoked':
        return 'revoked', state_info
    elif raw_state == 'interrupted':
        # Improved handling for interrupted tasks - check if we have enough artifacts to consider it successful
        artifacts = state_info.get('artifacts', {})
        if artifacts.get('has_json') and artifacts.get('has_results_csv'):
            logger.info(f"Task {task_id}: Found sufficient result artifacts despite interruption, treating as successful")
            return 'success', {
                **state_info, 
                'isReliableState': True,
                'stateReconstruction': 'Reconstructed from result artifacts after interruption'
            }
        # Truly interrupted with insufficient results
        logger.info(f"Task {task_id}: Interrupted with insufficient result artifacts, treating as failure")
        return 'failure', {
            **state_info, 
            'errorMessage': 'Task was interrupted and left in an invalid state',
            'isReliableState': True
        }
    elif raw_state == 'expired':
        return 'expired', state_info
    else:
        # Any other state we don't recognize, default to the Celery state
        return celery_state.lower(), state_info


def read_task_state(task_id: str) -> Optional[Dict[str, Any]]:
    """
    Read task state file if it exists.
    
    Args:
        task_id: Task ID to check
        
    Returns:
        Task state data from file or None if file doesn't exist
    """
    state_file = os.path.join(get_output_path(task_id), 'task_state.json')
    
    if not os.path.exists(state_file):
        return None
        
    try:
        with open(state_file, 'r', encoding='utf-8') as f:
            return json.loads(f.read())
    except Exception as e:
        logger.error(f"Failed to read task state file: {e}")
        return None

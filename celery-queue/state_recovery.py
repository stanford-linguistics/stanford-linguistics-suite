#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Celery Task State Recovery Script

This script is run during worker startup to scan task directories and reconcile
their state information with Celery's backend. This helps in recovering state information
after container restarts, which is a common failure point in containerized Celery setups.
"""
from __future__ import division, absolute_import
import os
import sys
import logging
import glob
import json
import io
import time

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("state_recovery")

# Constants
RESULTS_FOLDER = '/results'


def scan_completed_tasks():
    """
    Scan results directory for completed tasks and identify inconsistencies.
    
    Returns:
        dict: Statistics about recovered tasks
    """
    logger.info("Starting task state recovery scan")
    
    # Stats to track recovery operations
    stats = {
        'directories_scanned': 0,
        'success_markers_found': 0,
        'state_files_found': 0,
        'recovered_tasks': 0,
        'errors': 0
    }
    
    # Find all task directories
    try:
        task_dirs = glob.glob(os.path.join(RESULTS_FOLDER, '*', 'output'))
        logger.info("Found %d potential task output directories", len(task_dirs))
        stats['directories_scanned'] = len(task_dirs)
        
        for task_dir in task_dirs:
            # Extract task ID from path
            task_id = os.path.basename(os.path.dirname(task_dir))
            
            try:
                # Check for explicit success marker
                success_marker = os.path.join(task_dir, 'task_completed')
                state_file = os.path.join(task_dir, 'task_state.json')
                results_file = os.path.join(task_dir, 'results.csv')
                json_result = os.path.join('/public', task_id, 'results.json')
                
                # Only process if we find evidence of a completed task
                if os.path.exists(success_marker):
                    logger.info("Found success marker for task %s", task_id)
                    stats['success_markers_found'] += 1
                    log_recovery(task_id, "success", "success_marker")
                    stats['recovered_tasks'] += 1
                elif os.path.exists(results_file) and os.path.exists(json_result):
                    logger.info("Found result files for task %s", task_id)
                    log_recovery(task_id, "success", "result_files")
                    stats['recovered_tasks'] += 1
                elif os.path.exists(state_file):
                    stats['state_files_found'] += 1
                    with io.open(state_file, 'r', encoding='utf-8') as f:
                        try:
                            state_data = json.loads(f.read())
                            state = state_data.get('state')
                            
                            if state == 'success':
                                logger.info("State file indicates successful task %s", task_id)
                                log_recovery(task_id, "success", "state_file")
                                stats['recovered_tasks'] += 1
                            elif state == 'failure':
                                logger.info("State file indicates failed task %s", task_id)
                                log_recovery(task_id, "failure", state_data.get('error', 'Unknown error'))
                                stats['recovered_tasks'] += 1
                        except ValueError as e:
                            logger.warning("Invalid state file for task %s: %s", task_id, str(e))
            except Exception as e:
                logger.exception("Error processing task directory %s: %s", task_id, str(e))
                stats['errors'] += 1
                
    except Exception as e:
        logger.exception("Error scanning results directories: %s", str(e))
        stats['errors'] += 1
        
    logger.info("Recovery scan complete. Summary: %s", json.dumps(stats))
    return stats


def log_recovery(task_id, state, reason):
    """
    Log that a task's state was recovered during startup.
    
    Args:
        task_id: Task ID
        state: State recovered (success, failure, etc.)
        reason: Reason or source of the recovery
    """
    recovery_dir = os.path.join(RESULTS_FOLDER, task_id, 'output')
    recovery_file = os.path.join(recovery_dir, 'recovery_log.json')
    
    recovery_data = {
        'task_id': task_id,
        'recovered_state': state,
        'recovery_source': reason,
        'recovery_time': int(time.time()),
        'worker_pid': os.getpid()
    }
    
    try:
        with io.open(recovery_file, 'w', encoding='utf-8') as f:
            json_str = json.dumps(recovery_data, indent=2, ensure_ascii=False)
            if sys.version_info[0] >= 3:
                f.write(json_str)
            else:
                f.write(unicode(json_str))  # noqa: F821
    except Exception as e:
        logger.error("Error writing recovery log for task %s: %s", task_id, str(e))


if __name__ == "__main__":
    logger.info("============== STARTING TASK STATE RECOVERY ==============")
    stats = scan_completed_tasks()
    logger.info("Recovery summary: Recovered %d task states", stats['recovered_tasks'])
    logger.info("============== TASK STATE RECOVERY COMPLETE ==============")

#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Recover task states from file system to Redis.
Useful after Redis data loss or migration.

Usage:
    python recover_task_states.py [--dry-run]
"""
from __future__ import print_function
import os
import sys
import json
import glob
from shared.redis_state_manager import RedisStateManager
from shared.task_state_manager import read_task_state

def recover_states(dry_run=False):
    """
    Scan results directory and recover states to Redis.
    
    Args:
        dry_run: If True, only show what would be recovered without actually doing it
    """
    redis_state = RedisStateManager()
    results_dir = '/results'
    public_dir = '/public'
    
    print("Starting task state recovery...")
    if dry_run:
        print("DRY RUN MODE - No changes will be made")
    
    recovered = 0
    failed = 0
    already_exists = 0
    
    # Check if Redis is available
    if not redis_state.redis_client and not dry_run:
        print("ERROR: Redis connection not available. Cannot recover states.")
        return
    
    # Scan results directory
    if os.path.exists(results_dir):
        for task_id in os.listdir(results_dir):
            task_dir = os.path.join(results_dir, task_id)
            if os.path.isdir(task_dir):
                try:
                    # Check if state already exists in Redis
                    if not dry_run:
                        existing_state = redis_state.get_task_state(task_id)
                        if existing_state:
                            already_exists += 1
                            continue
                    
                    # Try to read file-based state
                    file_state = read_task_state(task_id)
                    
                    if file_state:
                        state = file_state.get('state', 'unknown')
                        
                        # Check for additional evidence of completion
                        output_dir = os.path.join(task_dir, 'output')
                        has_success_marker = os.path.exists(os.path.join(output_dir, 'task_completed'))
                        has_results = os.path.exists(os.path.join(output_dir, 'results.csv'))
                        has_json_result = os.path.exists(os.path.join(public_dir, task_id, 'results.json'))
                        
                        # Override state if we have strong evidence of success
                        if (has_success_marker or (has_results and has_json_result)) and state != 'success':
                            print("Task {0}: Overriding state to 'success' based on result artifacts".format(task_id))
                            state = 'success'
                        
                        if dry_run:
                            print("Would recover task {0} with state: {1}".format(task_id, state))
                        else:
                            # Push to Redis
                            success = redis_state.set_task_state(
                                task_id,
                                state,
                                file_state
                            )
                            
                            if success:
                                recovered += 1
                                print("Recovered state for task {0}: {1}".format(task_id, state))
                            else:
                                failed += 1
                                print("Failed to recover state for task: {0}".format(task_id))
                    else:
                        # No state file, but check if we have results
                        output_dir = os.path.join(task_dir, 'output')
                        if os.path.exists(output_dir):
                            # Look for evidence of completion
                            has_results = os.path.exists(os.path.join(output_dir, 'results.csv'))
                            has_json_result = os.path.exists(os.path.join(public_dir, task_id, 'results.json'))
                            
                            if has_results or has_json_result:
                                # Task completed but no state file
                                if dry_run:
                                    print("Would recover task {0} as 'success' (no state file but has results)".format(task_id))
                                else:
                                    success = redis_state.set_task_state(
                                        task_id,
                                        'success',
                                        {'recovered': True, 'reason': 'Has result files but no state file'}
                                    )
                                    
                                    if success:
                                        recovered += 1
                                        print("Recovered task {0} as 'success' based on result files".format(task_id))
                                    else:
                                        failed += 1
                                        print("Failed to recover task: {0}".format(task_id))
                
                except Exception as e:
                    print("Error processing task {0}: {1}".format(task_id, str(e)))
                    failed += 1
    
    # Print summary
    print("\nRecovery Summary:")
    print("Total tasks recovered: {0}".format(recovered))
    print("Already in Redis: {0}".format(already_exists))
    print("Failed to recover: {0}".format(failed))
    
    if not dry_run and redis_state.redis_client:
        # Print Redis statistics
        stats = redis_state.get_state_statistics()
        print("\nRedis State Statistics:")
        print("Total tasks in Redis: {0}".format(stats['total']))
        print("By state:", json.dumps(stats['by_state'], indent=2))
        print("By type:", json.dumps(stats['by_type'], indent=2))

def main():
    """Main entry point."""
    dry_run = '--dry-run' in sys.argv
    recover_states(dry_run)

if __name__ == '__main__':
    main()
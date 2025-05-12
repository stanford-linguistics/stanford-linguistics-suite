from __future__ import division
import os
import logging
from celery import Celery
import datetime
import json
import subprocess
import pipes
import time

# Import Celery exceptions at the top level
# Handle the case where Failure might not exist in the current Celery version
try:
    from celery.exceptions import Failure
except ImportError:
    # Define a custom Failure class if it doesn't exist in the current Celery version
    class Failure(Exception):
        """Custom Failure exception as fallback when not available in Celery."""
        pass

from shared.results_helper import (
    get_task_results_path,
    get_graphs_path,
    get_output_path,
    copy_results_to_json as results_helper_copy_results_to_json,
    zip_all,
    clean_directory,
    copy_graphs as results_helper_copy_graphs,
)
from shared.task_state_manager import (
    mark_task_started,
    mark_task_successful,
    mark_task_failed,
    write_task_state,
)
from metrical_tree_helpers.helpers import (
    call_metrical_tree,
    ensure_directory,
    verify_metrical_tree_results
)
from shared.error_handling import (
    TaskException, InputValidationException, ErrorCode, format_error_for_user
)
from metrical_tree_helpers.results_enhancer import enhance_metrical_tree_results
logger = logging.getLogger(__name__)


ONE_HOUR = 1 * 60 * 60  # seconds
ONE_DAY = ONE_HOUR * 24
FOLDER_TTL = ONE_DAY * 3
RESULTS_FOLDER = '/results'
PUBLIC_FOLDER = '/public'

CELERY_BROKER_URL = os.environ.get(
    'CELERY_BROKER_URL', 'redis://localhost:6379'),
CELERY_RESULT_BACKEND = os.environ.get(
    'CELERY_RESULT_BACKEND', 'redis://localhost:6379')

celery = Celery('tasks', broker=CELERY_BROKER_URL,
                backend=CELERY_RESULT_BACKEND)

class Result:
    def __init__(self, download_url, expires_in, expires_on, created_on):
        self.download_url = download_url
        self.expires_in = expires_in
        self.expires_on = expires_on
        self.created_on = created_on

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)


def get_safe_string(unsafe_string):
    return pipes.quote(unsafe_string)

def get_optional_args(hg_feasible_mappings_only, optimization_method, bound_on_number_of_candidates, num_trials, weight_bound, include_arrows):
    args_string = ''
    if hg_feasible_mappings_only:
        args_string += '--hg-feasible-mappings-only '
    if optimization_method is not None:
        args_string += '--optimization-method ' + \
            get_safe_string(optimization_method) + ' '
    if bound_on_number_of_candidates is not None:
        args_string += '--bound-on-number-of-candidates ' + \
            get_safe_string(str(bound_on_number_of_candidates)) + ' '
    if num_trials is not None:
        args_string += '--num-trials ' + get_safe_string(str(num_trials)) + ' '
    if weight_bound is not None:
        args_string += '--weight-bound ' + \
            get_safe_string(str(weight_bound)) + ' '
    if include_arrows:
        args_string += '--include-arrows'
    return args_string

def call_t_order(input_file_path, output_path, hg_feasible_mappings_only, optimization_method, bound_on_number_of_candidates, num_trials, weight_bound, include_arrows):
    optional_args = get_optional_args(hg_feasible_mappings_only, optimization_method,
                                      bound_on_number_of_candidates, num_trials, weight_bound, include_arrows)
    t_order_command = 'python torders/t_orders.py ' + get_safe_string(input_file_path) + \
        ' --output ' + get_safe_string(output_path) + ' ' + optional_args

    try:
        output = subprocess.check_output(
            t_order_command, shell=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as err:
        output = err.output
        return_code = err.returncode
        print('error message:', output)
        print('returned value:', return_code)
        raise ValueError(
            'Something went wrong while trying to process your file.', output)


def copy_graphs(folder_id):
    results_directory = os.path.join(
        get_task_results_path(folder_id), 'output')
    results_helper_copy_graphs(results_directory, folder_id)

def copy_results_to_json(folder_id):
    results_directory = os.path.join(
        get_task_results_path(folder_id), 'output')
    results_helper_copy_results_to_json(results_directory, folder_id)

def zip_results(input_filename, folder_id):
    directory_to_zip = get_task_results_path(folder_id)
    zip_name = 'results.zip'
    zip_all(directory_to_zip, zip_name)

def queue_delete_results_folder(folder_id):
    directory_to_delete = get_task_results_path(folder_id)
    celery.send_task("tasks.delete_folder", args=[
                     directory_to_delete], kwargs={}, countdown=FOLDER_TTL)

def queue_delete_graphs_folder(folder_id):
    directory_to_delete = get_graphs_path(folder_id)
    celery.send_task("tasks.delete_folder", args=[
                     directory_to_delete], kwargs={}, countdown=FOLDER_TTL)

def clean_results(folder_id):
    directory_to_clean = get_task_results_path(folder_id)
    clean_directory(os.path.join(directory_to_clean, 'input'))
    clean_directory(os.path.join(directory_to_clean, 'output'))
    queue_delete_results_folder(folder_id)
    queue_delete_graphs_folder(folder_id)

def get_download_url(folder_id):
    return '/results/' + folder_id + '/$value?external=True'

def get_expiration_on():
    current_datetime = datetime.datetime.now()
    delta = datetime.timedelta(seconds=FOLDER_TTL)
    epoch = datetime.datetime.utcfromtimestamp(0)
    expiration_date = current_datetime + delta
    return int((expiration_date - epoch).total_seconds())


@celery.task(name='tasks.compute_t_orders', bind=True)
def compute_t_orders(self, input_file_path,
                     input_filename,
                     hg_feasible_mappings_only,
                     optimization_method,
                     bound_on_number_of_candidates,
                     num_trials,
                     weight_bound,
                     include_arrows):
    self.update_state(state='RUNNING')
    folder_id = self.request.id

    output_path = get_output_path(folder_id)
    call_t_order(input_file_path, output_path, hg_feasible_mappings_only,
                 optimization_method, bound_on_number_of_candidates, num_trials, weight_bound, include_arrows)
    copy_graphs(folder_id)
    zip_results(input_filename, folder_id)
    result = Result(get_download_url(folder_id),
                    FOLDER_TTL, get_expiration_on())
    clean_results(folder_id)
    return result.toJSON()



@celery.task(name='tasks.compute_metrical_tree', bind=True)
def compute_metrical_tree(self, input_file_path,
                          input_filename,
                          unstressed_words,
                          unstressed_tags,
                          unstressed_deps,
                          ambiguous_words,
                          ambiguous_tags,
                          ambiguous_deps,
                          stressed_words):
    """
    Celery task to process metrical tree computations with enhanced state tracking.
    
    This task handles input validation, calls the metrical tree processing script,
    performs enhancement, and manages results. Task state is persistently tracked
    throughout execution to ensure reliable state recovery after worker restarts.
    """
    logger = logging.getLogger(__name__)
    self.update_state(state='RUNNING')
    folder_id = self.request.id
    
    # Mark task as started with initial metadata
    mark_task_started(folder_id, {
        'input_file': os.path.basename(input_file_path) if input_file_path else None,
        'started_at': int(time.time())
    })
    
    try:
        if input_file_path is None or not input_file_path.strip():
            mark_task_failed(folder_id, "No input file specified")
            raise InputValidationException(
                message="No input file specified",
                error_code=ErrorCode.MISSING_REQUIRED_FIELD,
                suggestion="Please provide a valid input file."
            )

        # Ensure all required directories exist and are writable
        output_path = get_output_path(folder_id)
        ensure_directory(os.path.dirname(output_path))
        ensure_directory(os.path.join(get_task_results_path(folder_id), 'input'))

        # Execute metrical tree computation - update state tracking
        logger.info("Processing metrical tree for task {}".format(folder_id), extra={
            'input_file': input_file_path,
            'output_path': output_path
        })
        
        # Mark computation stage
        write_task_state(folder_id, 'processing', {
            'stage': 'metrical_tree_computation',
            'input_file': os.path.basename(input_file_path)
        })

        call_metrical_tree(input_file_path,
                           output_path,
                           unstressed_words,
                           unstressed_tags,
                           unstressed_deps,
                           ambiguous_words,
                           ambiguous_tags,
                           ambiguous_deps,
                           stressed_words)

        # Mark verification stage
        write_task_state(folder_id, 'verifying', {
            'stage': 'result_verification'
        })
        verify_metrical_tree_results(folder_id)
        
        # Mark enhancement stage
        write_task_state(folder_id, 'enhancing', {
            'stage': 'results_enhancement'
        })
        enhance_metrical_tree_results(folder_id)
        
        # Mark packaging stage
        write_task_state(folder_id, 'packaging', {
            'stage': 'results_packaging'
        })
        zip_results(input_filename, folder_id)

        created_on = int((datetime.datetime.utcnow() - datetime.datetime(1970, 1, 1)).total_seconds())
        result = Result(
            get_download_url(folder_id),
            FOLDER_TTL,
            get_expiration_on(),
            created_on
        )
        
        # Create final success markers before cleanup
        mark_task_successful(folder_id, {
            'download_url': result.download_url,
            'expires_in': result.expires_in,
            'expires_on': result.expires_on,
            'created_on': created_on,
            'input_file': os.path.basename(input_file_path)
        })

        clean_results(folder_id)
        
        logger.info("Successfully completed metrical tree computation for task {}".format(folder_id))
        return result.toJSON()

    except TaskException as e:
        self.update_state(state='FAILURE')
        error_info = format_error_for_user(e)

        # Mark task as failed in persistent state file
        mark_task_failed(folder_id, {
            'error_code': e.error_code,
            'message': e.message,
            'suggestion': e.suggestion if hasattr(e, 'suggestion') else None
        })

        logger.error("Task error in task {}: {}".format(folder_id, e.message), extra={
            'error_info': error_info,
            'task_id': folder_id
        })

        error_result = {
            "download_url": None,
            "expires_in": None,
            "expires_on": None,
            "error": True,
            "errorMessage": e.message,
            "errorDetails": error_info
        }
        # Return a serialized JSON string instead of raising an exception
        # This will ensure the result can be properly parsed by the API
        return json.dumps(error_result)
    except Exception as e:
        self.update_state(state='FAILURE')
        logger.exception("Unexpected error in task {}".format(folder_id))
        
        # Mark task as failed in persistent state file with generic error
        mark_task_failed(folder_id, {
            'error_code': ErrorCode.UNEXPECTED_ERROR,
            'message': "An unexpected error occurred: {}".format(str(e)),
            'timestamp': int(time.time())
        })
        
        error_info = format_error_for_user(TaskException(
            message="An unexpected error occurred",
            error_code=ErrorCode.UNEXPECTED_ERROR,
            details={'error': str(e)},
            suggestion="Please try again or contact anttila@stanford.edu if the problem persists."
        ))
        
        error_result = {
            "download_url": None,
            "expires_in": None,
            "expires_on": None,
            "error": True,
            "errorMessage": "An unexpected error occurred",
            "errorDetails": error_info
        }
        # Instead of trying to import Failure (which may not exist), 
        # return the error result directly as JSON string
        return json.dumps(error_result)

@celery.task(name='tasks.delete_folder')
def delete_folder(directory_to_delete):
    clean_directory(directory_to_delete)

import os
import time
from celery import Celery
import results_helper
import datetime
import json
import subprocess
import pipes
import traceback
from error_handling import (
    capture_exception, MetricalTreeException, InputValidationException,
    LinguisticProcessingException, SystemException, ComputationalException,
    ErrorCode, format_error_for_user
)

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
    def __init__(self, download_url, expires_in, expires_on):
        self.download_url = download_url
        self.expires_in = expires_in
        self.expires_on = expires_on

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)


def get_output_path(folder_id):
    return os.path.join(RESULTS_FOLDER, folder_id, 'output')


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


def get_safe_list(unsafe_list):
    return map(get_safe_string, unsafe_list)


def get_metrical_tree_optional_args(unstressed_words, unstressed_tags, unstressed_deps, ambiguous_words, ambiguous_tags, ambiguous_deps, stressed_words):
    args_string = ''
    if unstressed_words is not None:
        args_string += '--unstressed_words ' + \
            ' '.join(get_safe_list(unstressed_words)) + ' '
    if unstressed_tags is not None:
        args_string += '--unstressed_tags ' + \
            ' '.join(get_safe_list(unstressed_tags)) + ' '
    if unstressed_deps is not None:
        args_string += '--unstressed_deps ' + \
            ' '.join(get_safe_list(unstressed_deps)) + ' '
    if ambiguous_words is not None:
        args_string += '--ambiguous_words ' + \
            ' '.join(get_safe_list(ambiguous_words)) + ' '
    if ambiguous_tags is not None:
        args_string += '--ambiguous_tags ' + \
            ' '.join(get_safe_list(ambiguous_tags)) + ' '
    if ambiguous_deps is not None:
        args_string += '--ambiguous_deps ' + \
            ' '.join(get_safe_list(ambiguous_deps)) + ' '
    if stressed_words is not None:
        args_string += '--stressed_words ' + \
            ' '.join(get_safe_list(stressed_words)) + ' '
    return args_string


@capture_exception
def call_metrical_tree(input_file_path, output_path, unstressed_words, unstressed_tags, unstressed_deps, ambiguous_words, ambiguous_tags, ambiguous_deps, stressed_words):
    """
    Execute the metrical tree script with the provided parameters.
    
    This function is wrapped with the capture_exception decorator to standardize error handling.
    """
    # Validate input file exists
    if not os.path.exists(input_file_path):
        raise SystemException(
            message="Input file not found: {}".format(input_file_path),
            error_code=ErrorCode.FILE_NOT_FOUND,
            suggestion="Ensure the uploaded file was saved correctly."
        )
    
    # Check if output directory exists, create if not
    output_dir = os.path.dirname(output_path)
    if not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir)
        except OSError as e:
            raise SystemException(
                message="Failed to create output directory: {}".format(str(e)),
                error_code=ErrorCode.PERMISSION_DENIED,
                suggestion="Check system permissions for creating directories."
            )
    
    # Check input file size
    try:
        file_size = os.path.getsize(input_file_path)
        # Set a reasonable limit, e.g., 10MB
        if file_size > 10 * 1024 * 1024:  
            raise InputValidationException(
                message="Input file is too large",
                error_code=ErrorCode.INPUT_TOO_LARGE,
                suggestion="Please use a smaller text file (under 10MB)."
            )
    except OSError as e:
        raise SystemException(
            message="Could not check file size: {}".format(str(e)),
            error_code=ErrorCode.FILE_NOT_FOUND,
            suggestion="Ensure the file exists and is accessible."
        )
    
    # Check if the file is empty
    try:
        if file_size == 0:
            raise InputValidationException(
                message="Input file is empty",
                error_code=ErrorCode.EMPTY_INPUT,
                suggestion="Please provide a non-empty text file."
            )
    except OSError:
        pass  # Already handled above
    
    # Build and execute command
    optional_args = get_metrical_tree_optional_args(
        unstressed_words, unstressed_tags, unstressed_deps, ambiguous_words, 
        ambiguous_tags, ambiguous_deps, stressed_words)
    
    metrical_tree_command = 'python metrical-tree/metricaltree.py ' + '--input-file ' + pipes.quote(input_file_path) + \
        ' --output ' + pipes.quote(output_path) + ' ' + optional_args
    
    print('Command: ', metrical_tree_command)
    
    try:
        # Python 2.7 doesn't support timeout parameter in subprocess.check_output
        # We'll need to implement our own timeout mechanism if needed
        output = subprocess.check_output(
            metrical_tree_command, shell=True, stderr=subprocess.STDOUT
        )
        print('SCRIPT OUTPUT:', output)
    # Python 2.7 doesn't have TimeoutExpired exception
    # except subprocess.TimeoutExpired:
    #     raise ComputationalException(
    #         message="The metrical tree processing timed out",
    #         error_code=ErrorCode.TIMEOUT,
    #         suggestion="Try processing a smaller text sample or check for syntax issues in your text."
    #     )
    except subprocess.CalledProcessError as err:
        output = err.output if hasattr(err, 'output') else "No output captured"
        return_code = err.returncode if hasattr(err, 'returncode') else "Unknown"
        
        print('error message:', output)
        print('returned value:', return_code)
        
        # Try to analyze the error output for more specific error reporting
        error_output = output.decode('utf-8', errors='replace') if isinstance(output, bytes) else str(output)
        
        if "MemoryError" in error_output:
            raise ComputationalException(
                message="The system ran out of memory while processing your text",
                error_code=ErrorCode.MEMORY_LIMIT_EXCEEDED,
                details={"error_output": error_output, "return_code": return_code},
                suggestion="Try processing a smaller text sample."
            )
        elif "syllabus_lookup_failure" in error_output or "KeyError" in error_output:
            raise LinguisticProcessingException(
                message="Failed to process some words in your text",
                error_code=ErrorCode.SYLLABUS_LOOKUP_FAILURE,
                details={"error_output": error_output, "return_code": return_code},
                suggestion="Check your text for unusual words or non-English content."
            )
        elif "UnicodeDecodeError" in error_output:
            raise InputValidationException(
                message="Text encoding issue detected",
                error_code=ErrorCode.ENCODING_ERROR,
                details={"error_output": error_output, "return_code": return_code},
                suggestion="Make sure your text file uses UTF-8 encoding."
            )
        elif "ValueError" in error_output and "ambiguity" in error_output:
            raise LinguisticProcessingException(
                message="Ambiguity resolution error",
                error_code=ErrorCode.AMBIGUITY_RESOLUTION_FAILURE,
                details={"error_output": error_output, "return_code": return_code},
                suggestion="Check your ambiguous words, tags, and dependencies configuration."
            )
        else:
            # Generic error handling
            raise LinguisticProcessingException(
                message="Error processing metrical tree",
                error_code=ErrorCode.PARSER_FAILURE,
                details={"error_output": error_output, "return_code": return_code},
                suggestion="Check your input text for syntax issues or try a different sample."
            )


def get_task_results_path(folder_id):
    return os.path.join(RESULTS_FOLDER, folder_id)


def get_graphs_path(folder_id):
    return os.path.join(PUBLIC_FOLDER, folder_id)


def copy_graphs(folder_id):
    results_directory = os.path.join(
        get_task_results_path(folder_id), 'output')
    results_helper.copy_graphs(results_directory, folder_id)


def copy_results_to_json(folder_id):
    results_directory = os.path.join(
        get_task_results_path(folder_id), 'output')
    results_helper.copy_results_to_json(results_directory, folder_id)


def zip_results(input_filename, folder_id):
    directory_to_zip = get_task_results_path(folder_id)
    zip_name = os.path.splitext(input_filename)[0] + '.zip'
    results_helper.zip_all(directory_to_zip, zip_name)


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
    results_helper.clean_directory(os.path.join(directory_to_clean, 'input'))
    results_helper.clean_directory(os.path.join(directory_to_clean, 'output'))
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
    call_t_order(input_file_path, get_output_path(folder_id), hg_feasible_mappings_only,
                 optimization_method, bound_on_number_of_candidates, num_trials, weight_bound, include_arrows)
    copy_graphs(folder_id)
    zip_results(input_filename, folder_id)
    result = Result(get_download_url(folder_id),
                    FOLDER_TTL, get_expiration_on())
    clean_results(folder_id)
    return result.toJSON()


@celery.task(name='tasks.delete_folder')
def delete_folder(directory_to_delete):
    results_helper.clean_directory(directory_to_delete)


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
    Celery task to process metrical tree computations.
    
    This task handles input validation, calls the metrical tree processing script,
    and properly formats any errors that occur during processing.
    """
    self.update_state(state='RUNNING')
    folder_id = self.request.id
    
    try:
        # Validate input parameters
        if input_file_path is None or not input_file_path.strip():
            raise InputValidationException(
                message="No input file specified",
                error_code=ErrorCode.MISSING_REQUIRED_FIELD,
                suggestion="Please provide a valid input file."
            )
            
        # Process the metrical tree
        call_metrical_tree(input_file_path, 
                           get_output_path(folder_id), 
                           unstressed_words,
                           unstressed_tags,
                           unstressed_deps,
                           ambiguous_words,
                           ambiguous_tags,
                           ambiguous_deps,
                           stressed_words)
                           
        # Process successful results
        copy_results_to_json(folder_id)
        zip_results(input_filename, folder_id)
        result = Result(get_download_url(folder_id), FOLDER_TTL, get_expiration_on())
        clean_results(folder_id)
        return result.toJSON()
        
    except MetricalTreeException as e:
        # For our custom exceptions, create a detailed error response
        self.update_state(state='FAILURE')
        error_info = format_error_for_user(e)
        
        # Log the error with details
        print("MetricalTreeException: {}".format(e.message))
        print("Error details: {}".format(json.dumps(error_info)))
        
        # Return error info in a structured format that matches our Result class
        error_result = {
            "download_url": None,
            "expires_in": None,
            "expires_on": None,
            "error": True,
            "errorMessage": e.message,
            "errorDetails": error_info
        }
        return json.dumps(error_result)
        
    except Exception as e:
        # For unexpected errors, provide a generic error message
        self.update_state(state='FAILURE')
        
        # Convert to our custom exception format for consistent handling
        generic_error = MetricalTreeException(
            message="An unexpected error occurred during processing",
            error_code=ErrorCode.UNEXPECTED_ERROR,
            details={"original_error": str(e), "traceback": traceback.format_exc()},
            suggestion="Please try again or contact support if the problem persists."
        )
        
        error_info = format_error_for_user(generic_error)
        
        # Log the error
        print("Unexpected error in compute_metrical_tree: {}".format(str(e)))
        print("Traceback: {}".format(traceback.format_exc()))
        
        # Return error info
        error_result = {
            "download_url": None,
            "expires_in": None,
            "expires_on": None,
            "error": True,
            "errorMessage": generic_error.message,
            "errorDetails": error_info
        }
        return json.dumps(error_result)

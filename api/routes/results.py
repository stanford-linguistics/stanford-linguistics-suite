import logging
import time
from typing import List, Dict, Optional, Union, Any, Tuple
from dataclasses import dataclass
from flask import url_for, make_response, send_from_directory, jsonify, current_app as app
from flask_api import status
from . import routes
from worker import celery
import celery.states as states
import os
import json
from task_state_utils import resolve_task_state, read_task_state

logger = logging.getLogger(__name__)

GRAPH_IMAGE_EXTENSION = '.png'

@dataclass
class Image:
    """Image resource with URL and name"""
    url: str
    name: str

@dataclass
class Result:
    """Result resource with URL and name"""
    url: str
    name: str

def get_filename(directory: str, extension: str) -> str:
    """
    Get the first filename with the specified extension in a directory.
    
    Args:
        directory: Directory to search
        extension: File extension to match
        
    Returns:
        Filename if found, empty string otherwise
    """
    try:
        for file in os.listdir(directory):
            if file.endswith(extension):
                return file
    except OSError as e:
        logger.error(f"Error accessing directory {directory}: {e}")
    return ''

def directory_exists(folder_id: str) -> bool:
    """
    Check if a task results directory exists.
    
    Args:
        folder_id: Task folder ID
        
    Returns:
        True if directory exists, False otherwise
    """
    directory = os.path.join(app.config['RESULTS_FOLDER'], folder_id)
    return os.path.exists(directory)

@routes.route('/results/<string:task_id>/$value', methods=['GET'])
def download_file(task_id: str):
    """
    Download the results file for a task.
    
    Args:
        task_id: Task ID
        
    Returns:
        File download response or 404 error
    """
    logger.info(f"--- Entering download_file for task_id: {task_id} ---")
    
    # Determine if this is a CoGeTo task
    is_cogeto, task_name = is_cogeto_task(task_id)
    if is_cogeto:
        logger.info(f"Download request for CoGeTo task {task_id}")
    
    directory = os.path.join(app.config['RESULTS_FOLDER'], task_id)
    logger.debug(f"Checking for file in directory: {directory}")
    
    # Check if the directory exists first and log its contents
    try:
        if os.path.exists(directory):
            logger.info(f"Directory exists: {directory}")
            files = os.listdir(directory)
            logger.info(f"Directory contents: {files}")
        else:
            logger.warning(f"Directory does not exist: {directory}")
    except Exception as e:
        logger.error(f"Error checking directory {directory}: {e}")
    
    # First check if the file exists in the expected location
    if directory_exists(task_id):
        zip_filename = get_filename(
            directory, app.config['OUTPUT_FILE_EXTENSION'])
        if zip_filename:
            zip_path = os.path.join(directory, zip_filename)
            logger.info(f"Found ZIP file for task {task_id}: {zip_path}")
            
            # Verify the file is accessible and log file stats
            try:
                file_stat = os.stat(zip_path)
                logger.info(f"File stats: size={file_stat.st_size}, permissions={oct(file_stat.st_mode)}")
                
                return send_from_directory(directory, zip_filename, as_attachment=True)
            except Exception as e:
                logger.error(f"Error sending file {zip_filename} for task {task_id}: {e}")
                return jsonify({
                    'error': 'Failed to send file',
                    'message': f'An error occurred while trying to download the file: {str(e)}'
                }), status.HTTP_500_INTERNAL_SERVER_ERROR
    
    # If file not found, check for CoGeTo success markers
    if is_cogeto:
        logger.info(f"ZIP file not found for CoGeTo task {task_id}, checking success markers")
        cogeto_success, cogeto_details = check_cogeto_success_markers(task_id)
        logger.debug(f"CoGeTo success details: {cogeto_details}")
        
        if cogeto_success:
            logger.warning(f"Download requested for CoGeTo task {task_id} which completed successfully but results were cleaned up")
            return jsonify({
                'error': 'File no longer available',
                'message': 'The results file was successfully generated but is no longer available for download. It may have been cleaned up to save space.',
                'wasSuccessful': True,
                'taskType': 'cogeto',
                'successDetails': cogeto_details
            }), status.HTTP_410_GONE
    
    # Standard check for success markers
    output_dir = os.path.join(app.config['RESULTS_FOLDER'], task_id, 'output')
    success_marker_path = os.path.join(output_dir, 'task_completed')
    task_state_file = os.path.join(output_dir, 'task_state.json')
    
    if os.path.exists(success_marker_path) or os.path.exists(task_state_file):
        logger.warning(f"Download requested for task {task_id} which completed successfully but results were cleaned up")
        return jsonify({
            'error': 'File no longer available',
            'message': 'The results file was successfully generated but is no longer available for download. It may have been cleaned up to save space.',
            'wasSuccessful': True
        }), status.HTTP_410_GONE
    else:
        logger.warning(f"No success indicators found for task {task_id}")
        return jsonify({
            'error': 'File not found',
            'message': f'No results found for task ID: {task_id}'
        }), status.HTTP_404_NOT_FOUND

def get_all_file_paths(directory: str) -> List[str]:
    """
    Get all file paths in a directory recursively.
    
    Args:
        directory: Directory to search
        
    Returns:
        List of absolute file paths
    """
    try:
        file_paths = []
        for root, directories, files in os.walk(directory):
            for filename in files:
                filepath = os.path.abspath(os.path.join(root, filename))
                file_paths.append(filepath)
        return file_paths
    except OSError as e:
        logger.error(f"Error walking directory {directory}: {e}")
        return []

def get_images(folder_id: str) -> List[Dict[str, str]]:
    """
    Get list of graph images for a task.
    
    Args:
        folder_id: Task folder ID
        
    Returns:
        List of image objects with URLs
    """
    images = []
    image_directory = os.path.join(app.config['PUBLIC_FOLDER'], folder_id)
    
    if not os.path.exists(image_directory):
        logger.warning(f"Image directory not found: {image_directory}")
        return images
        
    file_paths = get_all_file_paths(image_directory)
    for file in file_paths:
        if file.endswith(GRAPH_IMAGE_EXTENSION):
            head, tail = os.path.split(file)
            file_name = os.path.join(folder_id, tail)
            try:
                image = Image(
                    url_for('static', filename=file_name, _external=True, _scheme=app.config['PREFERRED_URL_SCHEME']), tail)
                images.append(image.__dict__)
            except Exception as e:
                logger.error(f"Error creating image URL for {file_name}: {e}")
    
    return images

def get_data(folder_id: str) -> Optional[Any]:
    """
    Get JSON results data for a task.
    
    Args:
        folder_id: Task folder ID
        
    Returns:
        Parsed JSON data or None if not found
    """
    results_path = os.path.join(
        app.config['PUBLIC_FOLDER'], folder_id, 'results.json')

    if not os.path.exists(results_path):
        logger.warning(f"Results file not found: {results_path}")
        return None

    try:
        with open(results_path) as f:
            return json.load(f)
    except (IOError, json.JSONDecodeError) as e:
        logger.error(f"Error reading results file {results_path}: {e}")
        return None

def get_data_url(folder_id: str) -> Optional[Dict[str, str]]:
    """
    Get URL for accessing JSON results.
    
    Args:
        folder_id: Task folder ID
        
    Returns:
        URL object or None if not found
    """
    results_path = os.path.join(
        app.config['PUBLIC_FOLDER'], folder_id, 'results.json')
    
    if not os.path.exists(results_path):
        logger.warning(f"Results file not found: {results_path}")
        return None
        
    try:
        head, tail = os.path.split(results_path)
        file_name = os.path.join(folder_id, tail)
        result = Result(
            url_for('static', filename=file_name, _external=True, _scheme=app.config['PREFERRED_URL_SCHEME']), tail)
        return result.__dict__
    except Exception as e:
        logger.error(f"Error creating data URL for {folder_id}: {e}")
        return None

def parse_result_json(result_str: Union[str, bytes, None], task_id: str) -> Dict[str, Any]:
    """
    Parse JSON result string from Celery task.
    
    Args:
        result_str: JSON string to parse
        task_id: Task ID for logging
        
    Returns:
        Parsed JSON data or empty dict on error
    """
    try:
        if not result_str:
            return {}
        if isinstance(result_str, bytes):
            result_str = result_str.decode('utf-8')
        return json.loads(result_str)
    except Exception as e:
        logger.exception(f"Failed to parse result JSON for task {task_id}: {e}")
        return {}

def check_for_error_result(result_data: Dict[str, Any]) -> bool:
    """
    Check if a result object indicates an error condition.
    
    Args:
        result_data: Parsed result data from task
        
    Returns:
        True if result indicates an error, False otherwise
    """
    if isinstance(result_data, dict):
        return result_data.get("error") is True
    return False

def check_result_files(task_id: str, retry_count: int = 0) -> bool:
    """
    Check if all required result files exist with retry mechanism.
    
    For tasks that have just completed, there might be a delay between
    when the task is marked as successful and when all result files are
    fully written to disk. This function implements a retry mechanism
    with exponential backoff to handle this race condition.
    
    Args:
        task_id: Task ID to check
        retry_count: Current retry attempt (used internally for recursion)
        
    Returns:
        True if all required files exist, False otherwise
    """
    results_dir = os.path.join(app.config['RESULTS_FOLDER'], task_id)
    public_dir = os.path.join(app.config['PUBLIC_FOLDER'], task_id)
    
    # Log directory existence first
    results_dir_exists = os.path.exists(results_dir)
    public_dir_exists = os.path.exists(public_dir)
    
    logger.info(f"Checking files for task {task_id}:")
    logger.info(f"- Results directory ({results_dir}): {'exists' if results_dir_exists else 'missing'}")
    logger.info(f"- Public directory ({public_dir}): {'exists' if public_dir_exists else 'missing'}")
    
    # Log contents of directories if they exist
    if results_dir_exists:
        try:
            results_files = os.listdir(results_dir)
            logger.info(f"- Results directory contents: {results_files}")
        except Exception as e:
            logger.error(f"Error reading results directory: {e}")
    
    if public_dir_exists:
        try:
            public_files = os.listdir(public_dir)
            logger.info(f"- Public directory contents: {public_files}")
        except Exception as e:
            logger.error(f"Error reading public directory: {e}")
    
    # Check for zip file (more detailed logging)
    zip_filename = get_filename(results_dir, app.config['OUTPUT_FILE_EXTENSION'])
    zip_exists = bool(zip_filename)
    
    # Log the zip file status
    if zip_exists:
        zip_path = os.path.join(results_dir, zip_filename)
        try:
            file_stat = os.stat(zip_path)
            logger.info(f"- ZIP file found: {zip_path}, size={file_stat.st_size}, permissions={oct(file_stat.st_mode)}")
        except Exception as e:
            logger.error(f"- ZIP file found but error accessing it: {e}")
    else:
        logger.info(f"- ZIP file not found in {results_dir}")
    
    # Check for results.json (more detailed logging)
    results_json_path = os.path.join(public_dir, 'results.json')
    json_exists = os.path.exists(results_json_path)
    
    # Log the JSON file status
    if json_exists:
        try:
            file_stat = os.stat(results_json_path)
            logger.info(f"- results.json found: {results_json_path}, size={file_stat.st_size}, permissions={oct(file_stat.st_mode)}")
        except Exception as e:
            logger.error(f"- results.json found but error accessing it: {e}")
    else:
        logger.info(f"- results.json not found at {results_json_path}")
    
    # Check for CoGeTo specific indicators and success markers
    is_cogeto, _ = is_cogeto_task(task_id)
    if is_cogeto:
        cogeto_success, cogeto_details = check_cogeto_success_markers(task_id)
        logger.info(f"- CoGeTo success indicators: {cogeto_success}")
        logger.info(f"- CoGeTo details: {cogeto_details}")
        
        # For CoGeTo tasks, we consider success differently:
        # If the task is identified as CoGeTo and we have explicit success indicators,
        # we can be more lenient about file existence
        if cogeto_success:
            # Check if we have either results.zip or PNG files
            if zip_exists or (public_dir_exists and any(f.endswith('.png') for f in public_files if public_dir_exists and 'public_files' in locals())):
                logger.info(f"CoGeTo task {task_id} has sufficient success indicators and at least some expected files")
                return True
    
    # If both files exist, we're good
    if zip_exists and json_exists:
        logger.info(f"Both ZIP and JSON files exist for task {task_id}")
        return True
    
    # Check task state to see if it's in packaging phase
    task_state_data = read_task_state(task_id)
    in_packaging_phase = False
    if task_state_data and task_state_data.get('state') == 'packaging':
        in_packaging_phase = True
        logger.info(f"Task {task_id} is in packaging phase, files may not be ready yet")
    
    # For tasks that have just completed, implement a retry mechanism
    # Increased retry limit from 5 to 6 attempts
    max_retries = 6
    if retry_count < max_retries:
        # Check if there are signs that the task is still completing
        # For example, if the public directory exists but json doesn't yet
        # Or if the task is in packaging phase
        if (os.path.exists(public_dir) and not json_exists) or in_packaging_phase:
            # Exponential backoff: 0.5s, 1s, 2s, 4s, 8s, 16s
            delay = 0.5 * (2 ** retry_count)
            logger.info(f"Files for task {task_id} not fully available yet. Retrying in {delay}s (attempt {retry_count + 1}/{max_retries})")
            time.sleep(delay)
            # Recursive call with incremented retry count
            return check_result_files(task_id, retry_count + 1)
    
    # If we've exhausted retries or no signs of ongoing completion, return the result
    # For CoGeTo tasks, just require the ZIP file for success
    if is_cogeto and zip_exists:
        logger.info(f"CoGeTo task {task_id} has ZIP file but no results.json - still considering successful")
        return True
    
    return zip_exists and json_exists

@routes.route('/metrical-tree-results/<string:task_id>')
def check_metrical_tree_task(task_id: str) -> Any:
    """
    Check status and retrieve results for a MetricalTree task with restructured response.
    Uses reliable state determination to handle worker container restarts.
    
    Args:
        task_id: Task ID to check
        
    Returns:
        JSON response with task status and results in the expected format
    """
    logger.info(f"--- Entering check_metrical_tree_task for task_id: {task_id} ---")
    try:
        # Get Celery's view of the task state
        res = celery.AsyncResult(task_id)
        celery_state = res.state
        
        # Use our enhanced state resolution to determine the most reliable state
        # This helps handle container restart scenarios where Celery might report PENDING
        # for tasks that were actually completed successfully
        reliable_state, state_info = resolve_task_state(task_id, celery_state)

        # Additional check - if we've previously seen this task as SUCCESS
        # and we're now getting PENDING, it might be due to a worker restart
        # Force override to SUCCESS if we have the results files
        if reliable_state == 'pending' and celery_state.upper() == 'PENDING':
            # Check for results files directly
            public_dir = os.path.join(app.config['PUBLIC_FOLDER'], task_id)
            json_path = os.path.join(public_dir, 'results.json')
            
            if os.path.exists(json_path):
                logger.warning(f"Task {task_id} is reported as PENDING by Celery, but results.json exists - forcing SUCCESS state")
                reliable_state = 'success'
                state_info = {
                    'state': 'success',
                    'source': 'forced_success_override',
                    'reliable': True,
                    'override_reason': f"Found results.json despite Celery reporting {celery_state}",
                    'stateReconstruction': 'Forced SUCCESS override based on results.json existence'
                }
        
        logger.info(f"Task {task_id} - Celery reports: {celery_state}, Resolved to: {reliable_state}")
        status_code = 200
        
        response_data = {
            'id': task_id,
            'status': None,
            'link': None,
            'expiresIn': None,
            'expiresOn': None,
            'errorMessage': None,
            'images': [],
            'data': [],
            'analysis': {},
            'sentences': {},
            'dataUrl': None,
            'createdOn': None,
            'stateSource': state_info.get('source', 'celery'),
            'isReliableState': state_info.get('reliable', False),
            'stateDetails': {}
        }
        
        # Enhanced reliability handling
        if state_info.get('reliable', False):
            response_data['stateReliability'] = 'high'
            
            # Include additional state resolution details for debugging/troubleshooting
            state_details = {}
            
            # Include the source of our state determination
            if 'source' in state_info:
                state_details['resolutionMethod'] = state_info['source']
            
            # If state was reconstructed from artifacts, include details
            if 'artifacts' in state_info:
                state_details['artifactsFound'] = state_info['artifacts']
            
            # If state has a custom message, include it
            if 'message' in state_info:
                state_details['message'] = state_info['message']
            
            # If we have state reconstruction info, include it
            if 'stateReconstruction' in state_info:
                state_details['reconstruction'] = state_info['stateReconstruction']
                
            response_data['stateDetails'] = state_details
        else:
            response_data['stateReliability'] = 'standard'

        # Read full task state file if it exists (contains detailed metadata)
        task_state_data = read_task_state(task_id)
        if task_state_data:
            # Populate any metadata from state file
            if 'timestamp' in task_state_data:
                response_data['stateTimestamp'] = task_state_data.get('timestamp')
            
        # Process based on the reliable state
        if reliable_state == 'success':
            logger.info(f"Task {task_id} is determined to be SUCCESSFUL.")
            result_data = parse_result_json(res.result, task_id) if celery_state == states.SUCCESS else {}
            
            # Even with reliable_state success, check for error indicators
            if check_for_error_result(result_data):
                logger.warning(f"Task {task_id} has error data despite success state. Marking as failure.")
                response_data.update({
                    'status': 'failure',
                    'errorMessage': result_data.get("errorMessage", "Task encountered an error"),
                    'errorDetails': result_data.get("errorDetails", {})
                })
            elif directory_exists(task_id) and check_result_files(task_id):
                # Get any additional info from task state file
                expires_in = None
                expires_on = None
                created_on = None
                
                if task_state_data and 'result_summary' in task_state_data:
                    summary = task_state_data.get('result_summary', {})
                    expires_in = summary.get('expires_in')
                    expires_on = summary.get('expires_on')
                    created_on = summary.get('created_on')
                
                # Fallback to result data if available
                if not all([expires_in, expires_on, created_on]) and result_data:
                    expires_in = result_data.get('expires_in', expires_in)
                    expires_on = result_data.get('expires_on', expires_on)
                    created_on = result_data.get('created_on', created_on)
                
                response_data.update({
                    'status': 'success',
                    'link': url_for('routes.download_file', task_id=task_id, _external=True, _scheme=app.config['PREFERRED_URL_SCHEME']),
                    'expiresIn': expires_in,
                    'expiresOn': expires_on,
                    'createdOn': created_on
                })
                
                try:
                    response_data['images'] = get_images(task_id)
                except Exception as e:
                    logger.warning(f"Could not get images for {task_id}: {e}")
                
                # Check for metadata.json to determine if it's a large dataset
                metadata_path = os.path.join(app.config['PUBLIC_FOLDER'], task_id, 'metadata.json')
                is_large_dataset = False
                data_size = 0
                
                if os.path.exists(metadata_path):
                    try:
                        with open(metadata_path) as f:
                            metadata = json.load(f)
                            is_large_dataset = metadata.get('isLargeDataset', False)
                            data_size = metadata.get('dataSize', 0)
                    except Exception as e:
                        logger.warning(f"Could not read metadata for {task_id}: {e}")
                
                # For large datasets, use summary data and set flags
                if is_large_dataset:
                    logger.info(f"Large dataset detected for {task_id} with {data_size} rows")
                    response_data['isLargeDataset'] = True
                    response_data['dataSize'] = data_size
                    
                    # Try to get summary data if available
                    summary_path = os.path.join(app.config['PUBLIC_FOLDER'], task_id, 'results_summary.json')
                    if os.path.exists(summary_path):
                        try:
                            with open(summary_path) as f:
                                summary_data = json.load(f)
                                # Only include analysis from summary, not the full data
                                response_data['analysis'] = summary_data.get('analysis', {})
                        except Exception as e:
                            logger.warning(f"Could not read summary data for {task_id}: {e}")
                else:
                    # For normal-sized datasets, get the full data
                    try:
                        json_data = get_data(task_id)
                        if json_data:
                            response_data['data'] = json_data.get('data', [])
                            response_data['analysis'] = json_data.get('analysis', {})
                            response_data['sentences'] = json_data.get('sentences', {})
                    except Exception as e:
                        logger.warning(f"Could not get data for {task_id}: {e}")
                
                try:
                    response_data['dataUrl'] = get_data_url(task_id)
                except Exception as e:
                    logger.warning(f"Could not get dataUrl for {task_id}: {e}")
            else:
                # Check if task is in packaging phase
                in_packaging_phase = False
                packaging_state = False
                
                # Check both the state file and the task state file
                if task_state_data:
                    # Direct check for packaging state
                    if task_state_data.get('state') == 'packaging':
                        in_packaging_phase = True
                        packaging_state = True
                        logger.info(f"Task {task_id} is explicitly in packaging phase according to state file")
                
                # Check if task was created or modified recently (within last 180 seconds)
                # This provides a more generous window during result file creation
                recently_created = False
                current_time = int(time.time())
                task_timestamp = task_state_data.get('timestamp', 0) if task_state_data else 0
                
                time_diff = current_time - task_timestamp
                if time_diff < 180:  # Within last 180 seconds (3 minutes)
                    recently_created = True
                    logger.info(f"Task {task_id} was created/modified recently ({time_diff}s ago)")
                
                # Check for file creation in progress
                # Look for ongoing file writes that might indicate packaging in progress
                results_dir = os.path.join(app.config['RESULTS_FOLDER'], task_id)
                public_dir = os.path.join(app.config['PUBLIC_FOLDER'], task_id)
                
                # If the public directory exists but results.json doesn't, that's an indicator
                # that file creation is in progress
                files_in_progress = os.path.exists(public_dir) and not os.path.exists(os.path.join(public_dir, 'results.json'))
                
                # If the results directory exists but zip file doesn't, that's another indicator
                files_in_progress = files_in_progress or (os.path.exists(results_dir) and not bool(get_filename(results_dir, app.config['OUTPUT_FILE_EXTENSION'])))
                
                if files_in_progress:
                    logger.info(f"Task {task_id} shows signs of file creation in progress")
                
                # If task is in packaging phase or was recently created or shows signs of file creation in progress,
                # treat as still running
                if in_packaging_phase or recently_created or files_in_progress:
                    logger.info(f"Task {task_id} is still processing (packaging: {packaging_state}, " +
                               f"recent: {recently_created}, files_in_progress: {files_in_progress}). " +
                               f"Marking as running.")
                    response_data.update({
                        'status': 'running',
                        'executionStage': 'packaging' if in_packaging_phase else 'processing',
                        'executionInfo': 'Finalizing results'
                    })
                else:
                    logger.warning(f"Results missing for task {task_id} despite success state. Marking as expired.")
                    response_data.update({
                        'status': 'expired',
                        'expiresIn': result_data.get('expires_in'),
                        'expiresOn': result_data.get('expires_on'),
                        'errorMessage': "Result files are missing. The results may have expired or were cleaned up."
                    })
        
        elif reliable_state == 'failure':
            logger.error(f"Task {task_id} determined to have FAILED.")
            result_data = parse_result_json(res.result, task_id) if celery_state == states.FAILURE else {}
            
            # Check for error message in state_info first (more reliable after restart)
            error_message = state_info.get('errorMessage')
            
            # If not in state_info, check task_state_data
            if not error_message and task_state_data:
                error_message = task_state_data.get('error')
            
            # If still not found, check result_data as fallback
            if not error_message and result_data:
                error_message = (
                    result_data.get("errorMessage", "Task failed due to an internal error.")
                    if isinstance(result_data, dict) and result_data.get("error")
                    else "Task failed due to an internal error."
                )
            
            # Default message if all else fails
            if not error_message:
                error_message = "Task failed due to an internal error."
                
            response_data.update({
                'status': 'failure',
                'errorMessage': error_message
            })
            
        elif reliable_state == 'pending':
            logger.info(f"Task {task_id} is determined to be PENDING.")
            response_data['status'] = 'pending'
            
        elif reliable_state == 'running':
            logger.info(f"Task {task_id} is determined to be RUNNING.")
            # If we have more specific stage info from the state file, include it
            if state_info.get('stage'):
                response_data['executionStage'] = state_info.get('stage')
                response_data['executionInfo'] = state_info.get('stage_info')
            response_data['status'] = 'running'
            
        elif reliable_state == 'revoked':
            logger.info(f"Task {task_id} is determined to be REVOKED.")
            response_data['status'] = 'revoked'
            
        else:
            logger.warning(f"Task {task_id} in unexpected state: {reliable_state}")
            response_data['status'] = reliable_state

        logger.info(f"Returning status for task {task_id}: {response_data['status']}, HTTP status: {status_code}")
        return make_response(jsonify(response_data), status_code)
        
    except Exception as e:
        logger.exception(f"--- Uncaught exception in check_metrical_tree_task for task_id: {task_id} ---")
        return make_response(jsonify({
            'id': task_id,
            'status': states.FAILURE,
            'errorMessage': "An internal server error occurred.",
            'error_details': str(e) if app.config.get('DEBUG', False) else None
        }), 500)


def is_cogeto_task(task_id: str) -> Tuple[bool, Optional[str]]:
    """
    Determine if a task is a CoGeTo task using multiple detection methods.
    
    Args:
        task_id: Task ID to check
        
    Returns:
        Tuple of (is_cogeto_task, task_name)
    """
    # Method 1: Try to check the task in Redis directly
    try:
        res = celery.AsyncResult(task_id)
        # First try to get the task name using various attribute lookups
        task_name = None
        
        # Try different attributes that could hold the task name (Celery version differences)
        for attr in ['name', 'task_name', 'task', 'type']:
            if hasattr(res, attr):
                task_name = getattr(res, attr)
                logger.debug(f"Found task name from {attr} attribute: {task_name}")
                break
                
        # If task name was found and contains the t-orders identifier
        if task_name and 'compute_t_orders' in str(task_name):
            logger.info(f"Task {task_id} identified as a CoGeTo task through task name: {task_name}")
            return True, task_name
            
        # If Celery has info dictionary, check there
        if hasattr(res, 'info') and isinstance(res.info, dict) and res.info.get('task_name'):
            task_name = res.info.get('task_name')
            if 'compute_t_orders' in str(task_name):
                logger.info(f"Task {task_id} identified as a CoGeTo task through info.task_name: {task_name}")
                return True, task_name
    except Exception as e:
        logger.warning(f"Could not determine task type via Celery for {task_id}: {e}")
    
    # Method 2: Look at task output artifacts to determine task type
    try:
        # Check if this task has CoGeTo-specific artifacts
        public_dir = os.path.join(app.config['PUBLIC_FOLDER'], task_id)
        results_dir = os.path.join(app.config['RESULTS_FOLDER'], task_id)
        
        # Indicators that this is a t-orders (CoGeTo) task:
        t_order_indicators = [
            # CoGeTo tasks have graph images in the public folder
            any(f.endswith('.png') for f in os.listdir(public_dir)) if os.path.exists(public_dir) else False,
            # CoGeTo tasks have results.json in the public folder
            os.path.exists(os.path.join(public_dir, 'results.json')),
            # CoGeTo tasks have a ZIP file in the results folder
            os.path.exists(results_dir) and any(f.endswith('.zip') for f in os.listdir(results_dir)) if os.path.exists(results_dir) else False
        ]
        
        if any(t_order_indicators):
            logger.info(f"Task {task_id} identified as a CoGeTo task through artifacts")
            return True, "tasks.compute_t_orders (detected by artifacts)"
    except Exception as e:
        logger.warning(f"Could not check for CoGeTo artifacts for {task_id}: {e}")
    
    # Method 3: If no other methods detected it, check if the task follows t-orders pattern
    # This may not be 100% reliable but serves as a fallback
    try:
        # Try to infer from the format of the task_id or other patterns specific to CoGeTo tasks
        # (This is a placeholder - implement specific patterns if they exist)
        pass
    except Exception as e:
        logger.warning(f"Could not perform pattern detection for {task_id}: {e}")
    
    # No CoGeTo indicators found
    logger.info(f"Task {task_id} is NOT identified as a CoGeTo task (no indicators)")
    return False, None


def check_cogeto_success_markers(task_id: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Check for success markers for CoGeTo tasks, whose output directories 
    may have been deleted after successful completion.
    
    Args:
        task_id: Task ID to check
        
    Returns:
        Tuple of (success_detected, details_dict)
    """
    logger.info(f"Checking CoGeTo success markers for task {task_id}")
    
    # Log all the directories we're checking to help debug path issues
    results_dir = os.path.join(app.config['RESULTS_FOLDER'], task_id)
    output_dir = os.path.join(results_dir, 'output')
    public_dir = os.path.join(app.config['PUBLIC_FOLDER'], task_id)
    
    logger.debug(f"Checking directories: results={results_dir}, output={output_dir}, public={public_dir}")
    
    # Check main results directory existence
    results_dir_exists = os.path.exists(results_dir)
    logger.debug(f"Results directory exists: {results_dir_exists}")
    
    # Check output directory existence
    output_dir_exists = os.path.exists(output_dir)
    logger.debug(f"Output directory exists: {output_dir_exists}")
    
    # Check public directory existence
    public_dir_exists = os.path.exists(public_dir)
    logger.debug(f"Public directory exists: {public_dir_exists}")
    
    # Check for success marker
    success_marker_path = os.path.join(output_dir, 'task_completed')
    has_success_marker = os.path.exists(success_marker_path)
    logger.debug(f"Success marker exists: {has_success_marker} (path: {success_marker_path})")
    
    # Check task state file
    task_state_file = os.path.join(output_dir, 'task_state.json')
    task_state_exists = os.path.exists(task_state_file)
    logger.debug(f"Task state file exists: {task_state_exists} (path: {task_state_file})")
    
    state_indicates_success = False
    if task_state_exists:
        try:
            with open(task_state_file, 'r') as f:
                state_data = json.load(f)
                state_indicates_success = state_data.get('state') == 'success'
                logger.debug(f"Task state indicates success: {state_indicates_success}")
        except Exception as e:
            logger.warning(f"Could not read task state file for {task_id}: {e}")
    
    # Check for success in task result - this comes from Celery's result backend
    # and should be available even if the output directories were cleaned up
    success_in_result = False
    result_data = {}
    try:
        res = celery.AsyncResult(task_id)
        if res.state == states.SUCCESS:
            result_str = res.result
            if result_str:
                try:
                    if isinstance(result_str, bytes):
                        result_str = result_str.decode('utf-8')
                    result_data = json.loads(result_str)
                    # Check if this has error flag - if not, it's a successful result
                    success_in_result = not result_data.get('error', False)
                    logger.debug(f"Task result indicates success: {success_in_result}")
                except Exception as e:
                    logger.warning(f"Could not parse result data for {task_id}: {e}")
    except Exception as e:
        logger.warning(f"Could not check result data for {task_id}: {e}")
    
    # Check the public directory for results.json and images
    # This is another strong indicator of success
    public_results_exist = os.path.exists(os.path.join(public_dir, 'results.json'))
    logger.debug(f"Public results.json exists: {public_results_exist}")
    
    public_images_exist = False
    if public_dir_exists:
        try:
            for file in os.listdir(public_dir):
                if file.endswith('.png'):
                    public_images_exist = True
                    break
            logger.debug(f"Public images exist: {public_images_exist}")
        except Exception as e:
            logger.warning(f"Could not check for images in {public_dir}: {e}")
    
    # Success is indicated by:
    # 1. Success marker or state file indicating success
    # 2. OR if result data indicates success
    # 3. OR if public directory has results.json and images (clear sign of successful completion)
    success_detected = (
        has_success_marker or
        state_indicates_success or
        (success_in_result and not check_for_error_result(result_data)) or
        (public_results_exist and public_images_exist)
    )
    
    logger.info(f"CoGeTo success detection for task {task_id}: {success_detected}")
    
    details = {
        'has_success_marker': has_success_marker,
        'state_indicates_success': state_indicates_success,
        'success_in_result': success_in_result,
        'public_results_exist': public_results_exist,
        'public_images_exist': public_images_exist,
        'results_dir_exists': results_dir_exists,
        'output_dir_exists': output_dir_exists,
        'public_dir_exists': public_dir_exists
    }
    
    return success_detected, details


@routes.route('/results/<string:task_id>')
def check_task(task_id: str) -> Any:
    """
    Check status and retrieve results for a task.
    
    Args:
        task_id: Task ID to check
        
    Returns:
        JSON response with task status and results
    """
    logger.info(f"--- Entering check_task for task_id: {task_id} ---")
    
    # Determine if this is a CoGeTo task
    is_cogeto, task_name = is_cogeto_task(task_id)
    if is_cogeto:
        logger.info(f"Task {task_id} identified as a CoGeTo task (task_name: {task_name})")
    else:
        logger.info(f"Task {task_id} is not a CoGeTo task (task_name: {task_name or 'unknown'})")
    try:
        res = celery.AsyncResult(task_id)
        task_status = res.state
        status_code = 200
        
        response_data = {
            'id': task_id,
            'status': None,
            'link': None,
            'expiresIn': None,
            'expiresOn': None,
            'errorMessage': None,
            'images': [],
            'data': None,
            'dataUrl': None,
            'createdOn': None
        }

        if task_status == states.SUCCESS:
            logger.info(f"Task {task_id} is SUCCESS.")
            result_data = parse_result_json(res.result, task_id)
            
            if check_for_error_result(result_data):
                logger.warning(f"Task {task_id} returned SUCCESS but contains error data. Marking as failure.")
                response_data.update({
                    'status': 'failure',
                    'errorMessage': result_data.get("errorMessage", "Task encountered an error"),
                    'errorDetails': result_data.get("errorDetails", {})
                })
            
            # Special handling for CoGeTo tasks which clean up their output directories after success
            cogeto_success = False
            cogeto_details = {}
            if is_cogeto:
                logger.info(f"Using enhanced success detection for CoGeTo task {task_id}")
                cogeto_success, cogeto_details = check_cogeto_success_markers(task_id)
                logger.debug(f"CoGeTo success details: {cogeto_details}")
            
            # For non-CoGeTo tasks or as a fallback, use the regular success detection
            regular_success = directory_exists(task_id) and check_result_files(task_id)
            
            # Either CoGeTo-specific success or regular success detection is sufficient
            if cogeto_success or regular_success:
                # Base success response with common fields
                response_data.update({
                    'status': 'success',
                    'expiresIn': result_data.get('expires_in'),
                    'expiresOn': result_data.get('expires_on'),
                    'createdOn': result_data.get('created_on')
                })
                
                # Special case for CoGeTo tasks where files were cleaned up
                # This is determined by checking if cogeto_success is true, but files are missing
                # If files exist, we can use the normal flow below
                if is_cogeto and cogeto_success and not (
                    cogeto_details.get('results_dir_exists', False) and 
                    cogeto_details.get('public_results_exist', False)
                ):
                    logger.info(f"CoGeTo task {task_id} was successful but result files were cleaned up")
                    
                    # Still provide a link even though files are cleaned up
                    # The download_file function will handle the expired case
                    response_data['link'] = url_for('routes.download_file', 
                                                  task_id=task_id, 
                                                  _external=True, 
                                                  _scheme=app.config['PREFERRED_URL_SCHEME'])
                    
                    # Include task type and success marker details in response
                    response_data['taskType'] = 'cogeto'
                    response_data['resultFilesCleanedUp'] = True
                    response_data['successDetails'] = cogeto_details
                    
                    # Attempt to get any images that might still exist
                    # This is non-critical, so wrapped in try-except
                    try:
                        if cogeto_details.get('public_dir_exists', False):
                            response_data['images'] = get_images(task_id)
                    except Exception as e:
                        logger.warning(f"Could not get images for CoGeTo task {task_id}: {e}")
                else:
                    # Normal success flow for tasks with available files
                    response_data['link'] = url_for('routes.download_file', 
                                                  task_id=task_id, 
                                                  _external=True, 
                                                  _scheme=app.config['PREFERRED_URL_SCHEME'])
                    
                    try:
                        response_data['images'] = get_images(task_id)
                    except Exception as e:
                        logger.warning(f"Could not get images for {task_id}: {e}")
                    
                    try:
                        response_data['data'] = get_data(task_id)
                    except Exception as e:
                        logger.warning(f"Could not get data for {task_id}: {e}")
                    
                    try:
                        response_data['dataUrl'] = get_data_url(task_id)
                    except Exception as e:
                        logger.warning(f"Could not get dataUrl for {task_id}: {e}")
            else:
                # Check if task is in packaging phase
                task_state_data = read_task_state(task_id)
                in_packaging_phase = False
                if task_state_data and task_state_data.get('state') == 'packaging':
                    in_packaging_phase = True
                
                # Check if task was created recently (within last 60 seconds)
                recently_created = False
                current_time = int(time.time())
                task_timestamp = task_state_data.get('timestamp', 0) if task_state_data else 0
                
                if current_time - task_timestamp < 60:  # Within last 60 seconds
                    recently_created = True
                    logger.info(f"Task {task_id} was created recently ({current_time - task_timestamp}s ago)")
                
                # If task is in packaging phase or was created recently, treat as still running
                if in_packaging_phase or recently_created:
                    logger.info(f"Task {task_id} is still processing (packaging phase: {in_packaging_phase}, recently created: {recently_created}). Marking as running.")
                    response_data.update({
                        'status': 'running',
                        'executionStage': 'packaging' if in_packaging_phase else 'processing',
                        'executionInfo': 'Finalizing results'
                    })
                else:
                    logger.warning(f"Results missing for SUCCESS task {task_id}. Marking as expired.")
                    response_data.update({
                        'status': 'expired',
                        'expiresIn': result_data.get('expires_in'),
                        'expiresOn': result_data.get('expires_on'),
                        'errorMessage': "Result files are missing. The results may have expired or were cleaned up."
                    })
                
        elif task_status == states.FAILURE:
            logger.error(f"Task {task_id} failed. Raw result: {res.result}")
            result_data = parse_result_json(res.result, task_id)
            response_data.update({
                'status': 'failure',
                'errorMessage': (
                    result_data.get("errorMessage", "Task failed due to an internal error.")
                    if isinstance(result_data, dict) and result_data.get("error")
                    else "Task failed due to an internal error."
                )
            })
            
        elif task_status == states.PENDING:
            logger.info(f"Task {task_id} is PENDING.")
            response_data['status'] = 'pending'
            
        elif task_status == 'STARTED':
            logger.info(f"Task {task_id} is RUNNING.")
            response_data['status'] = 'running'
            
        elif task_status == states.RETRY:
            logger.info(f"Task {task_id} is RETRYING.")
            response_data['status'] = 'retry'
            
        elif task_status == states.REVOKED:
            logger.info(f"Task {task_id} is REVOKED.")
            response_data['status'] = 'revoked'
            
        else:
            logger.warning(f"Task {task_id} in unexpected state: {task_status}")
            response_data['status'] = str(task_status)

        logger.info(f"Returning status for task {task_id}: {response_data['status']}, HTTP status: {status_code}")
        return make_response(jsonify(response_data), status_code)
        
    except Exception as e:
        logger.exception(f"--- Uncaught exception in check_task for task_id: {task_id} ---")
        return make_response(jsonify({
            'id': task_id,
            'status': states.FAILURE,
            'errorMessage': "An internal server error occurred.",
            'error_details': str(e) if app.config.get('DEBUG', False) else None
        }), 500)


@routes.route('/task-states/stats', methods=['GET'])
def get_state_stats():
    """
    Get statistics about task states from Redis.
    
    Returns:
        JSON response with state statistics
    """
    try:
        from redis_state_utils import redis_state_client
        
        stats = redis_state_client.get_state_statistics()
        
        return make_response(jsonify({
            'success': True,
            'stats': stats,
            'timestamp': int(time.time())
        }), 200)
        
    except Exception as e:
        logger.exception("Error getting state statistics")
        return make_response(jsonify({
            'success': False,
            'error': str(e)
        }), 500)


@routes.route('/task-states/cleanup', methods=['POST'])
def cleanup_old_states():
    """
    Clean up task states older than specified days.
    
    Request body (optional):
        days: Number of days to keep states (default: 30)
    
    Returns:
        JSON response with cleanup results
    """
    try:
        from flask import request
        from redis_state_utils import redis_state_client
        
        # Get days parameter from request body
        data = request.get_json() or {}
        days = data.get('days', 30)
        
        # Validate days parameter
        if not isinstance(days, int) or days < 1:
            return make_response(jsonify({
                'success': False,
                'error': 'Invalid days parameter. Must be a positive integer.'
            }), 400)
        
        # Perform cleanup
        cleaned_count = redis_state_client.cleanup_old_states(days)
        
        return make_response(jsonify({
            'success': True,
            'cleaned': cleaned_count,
            'days': days,
            'message': f'Cleaned up {cleaned_count} task states older than {days} days'
        }), 200)
        
    except Exception as e:
        logger.exception("Error cleaning up old states")
        return make_response(jsonify({
            'success': False,
            'error': str(e)
        }), 500)


@routes.route('/task-states/<task_id>', methods=['GET'])
def get_task_state_details(task_id: str):
    """
    Get detailed state information for a specific task from Redis.
    
    Args:
        task_id: Task ID to query
        
    Returns:
        JSON response with task state details
    """
    try:
        from redis_state_utils import redis_state_client
        
        # Get state from Redis
        redis_state = redis_state_client.get_task_state(task_id)
        
        if not redis_state:
            return make_response(jsonify({
                'success': False,
                'error': 'Task state not found in Redis'
            }), 404)
        
        return make_response(jsonify({
            'success': True,
            'task_id': task_id,
            'state': redis_state,
            'timestamp': int(time.time())
        }), 200)
        
    except Exception as e:
        logger.exception(f"Error getting state for task {task_id}")
        return make_response(jsonify({
            'success': False,
            'error': str(e)
        }), 500)

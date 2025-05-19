from flask import url_for, make_response, json, jsonify, request, send_from_directory, current_app as app
from . import routes
from worker import celery
import celery.states as states
from flask_expects_json import expects_json
from flask_api import status
import os
import time
import logging

logger = logging.getLogger(__name__)

schema = {
    'type': 'object',
    'properties': {
        'name': {'type': 'string', "default": ""},
        'description': {'type': 'string', "default": ""},
        'hgFeasibleMappingsOnly': {'type': 'boolean', "default": False},
        'optimizationMethod': {'type': 'string', "enum": ["simplex", "interior-point"], "default": "simplex"},
        'boundOnNumberOfCandidates': {'type': 'number', "default": 10},
        'numTrials': {'type': 'number', "default": 10000},
        'weightBound': {'type': 'number', "default": 20},
        'includeArrows': {'type': 'boolean', "default": False}
    }
}


def get_filename(directory, allowed_extensions):
    filename = ''
    for file in os.listdir(directory):
        if file.rsplit('.', 1)[1].lower() in allowed_extensions:
            filename = file
            break

    return filename


def directory_exists(directory):
    if os.path.exists(directory):
        return True
    else:
        return False


def write_script_params_to_file(directory, params):
    paramsFile = os.path.join(directory, 'inputs.json')
    with open(paramsFile, 'w') as f:
        json.dump(params, f)


@routes.route('/torders/<string:folder_id>', methods=['POST'])
@expects_json(schema, fill_defaults=True)
def compute_t_order(folder_id):
    directory = os.path.join(app.config['RESULTS_FOLDER'], folder_id, 'input')
    if directory_exists(directory):
        input_filename = get_filename(
            directory, app.config['ALLOWED_EXTENSIONS'])
        if input_filename != '':
            params = request.get_json()
            if params['name']:
                name = params['name']
            else:
                name = input_filename

            write_script_params_to_file(directory, params)
            input_file_path = os.path.join(directory, input_filename)
            task = celery.send_task('tasks.compute_t_orders', args=[
                                    input_file_path,
                                    input_filename,
                                    params['hgFeasibleMappingsOnly'],
                                    params['optimizationMethod'],
                                    params['boundOnNumberOfCandidates'],
                                    params['numTrials'],
                                    params['weightBound'],
                                    params['includeArrows']], kwargs={}, task_id=folder_id)
            # Use torders-specific endpoint for status checking
            link = url_for('routes.check_torder_task', task_id=task.id,
                           _external=True, _scheme='https')
            return make_response(jsonify(id=task.id, name=name, description=params['description'], status=task.state, link=link, errorMessage=None, params=params), 201)
        else:
            return 'No file belonging to id: ' + folder_id + ' was found.', status.HTTP_404_NOT_FOUND
        
        
def parse_result_json(result_str, task_id):
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


def check_for_error_result(result_data):
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


@routes.route('/torders-results/<string:task_id>/$value', methods=['GET'])
def download_torder_file(task_id):
    """
    Download the results file for a CoGeTo task.
    
    Args:
        task_id: Task ID
        
    Returns:
        File download response or 404 error
    """
    directory = os.path.join(app.config['RESULTS_FOLDER'], task_id)
    
    # First check if the file exists in the expected location
    if directory_exists(directory):
        zip_filename = get_filename(
            directory, app.config['OUTPUT_FILE_EXTENSION'])
        if zip_filename:
            try:
                return send_from_directory(directory, zip_filename, as_attachment=True)
            except Exception as e:
                logger.error(f"Error sending file {zip_filename} for task {task_id}: {e}")
                return jsonify({
                    'error': 'Failed to send file',
                    'message': 'An error occurred while trying to download the file.'
                }), status.HTTP_500_INTERNAL_SERVER_ERROR
    
    # Check for success marker or task state file
    output_dir = os.path.join(app.config['RESULTS_FOLDER'], task_id, 'output')
    success_marker_path = os.path.join(output_dir, 'task_completed')
    task_state_file = os.path.join(output_dir, 'task_state.json')
    
    # If we have a success marker or task state file with success status, but no file,
    # it means the task completed successfully but the results were cleaned up
    if os.path.exists(success_marker_path):
        logger.warning(f"Download requested for task {task_id} which completed successfully but results were cleaned up")
        return jsonify({
            'error': 'File no longer available',
            'message': 'The results file was successfully generated but is no longer available for download. It may have been cleaned up to save space.',
            'wasSuccessful': True
        }), status.HTTP_410_GONE
    elif os.path.exists(task_state_file):
        try:
            with open(task_state_file, 'r') as f:
                state_data = json.load(f)
                if state_data.get('state') == 'success':
                    logger.warning(f"Download requested for task {task_id} which completed successfully but results were cleaned up")
                    return jsonify({
                        'error': 'File no longer available',
                        'message': 'The results file was successfully generated but is no longer available for download. It may have been cleaned up to save space.',
                        'wasSuccessful': True
                    }), status.HTTP_410_GONE
        except Exception as e:
            logger.warning(f"Could not read task state file for {task_id}: {e}")
    
    # If no success indicators, return 404
    return jsonify({
        'error': 'File not found',
        'message': f'No results found for task ID: {task_id}'
    }), status.HTTP_404_NOT_FOUND


def get_images(folder_id):
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
        
    try:
        for file in os.listdir(image_directory):
            if file.endswith('.png'):
                file_name = os.path.join(folder_id, file)
                try:
                    image = {
                        'url': url_for('static', filename=file_name, _external=True, _scheme=app.config['PREFERRED_URL_SCHEME']),
                        'name': file
                    }
                    images.append(image)
                except Exception as e:
                    logger.error(f"Error creating image URL for {file_name}: {e}")
    except OSError as e:
        logger.error(f"Error accessing directory {image_directory}: {e}")
    
    return images


def get_data(folder_id):
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


def get_data_url(folder_id):
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
        result = {
            'url': url_for('static', filename=file_name, _external=True, _scheme=app.config['PREFERRED_URL_SCHEME']),
            'name': tail
        }
        return result
    except Exception as e:
        logger.error(f"Error creating data URL for {folder_id}: {e}")
        return None


def check_result_files(task_id, retry_count=0):
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
    
    # Check for zip file
    zip_exists = bool(get_filename(results_dir, app.config['OUTPUT_FILE_EXTENSION']))
    
    # Check for results.json
    json_exists = os.path.exists(os.path.join(public_dir, 'results.json'))
    
    # If both files exist, we're good
    if zip_exists and json_exists:
        return True
    
    # Check task state to see if it's in packaging phase
    output_dir = os.path.join(app.config['RESULTS_FOLDER'], task_id, 'output')
    task_state_file = os.path.join(output_dir, 'task_state.json')
    in_packaging_phase = False
    if os.path.exists(task_state_file):
        try:
            with open(task_state_file, 'r') as f:
                state_data = json.load(f)
                if state_data.get('state') == 'packaging':
                    in_packaging_phase = True
                    logger.info(f"Task {task_id} is in packaging phase, files may not be ready yet")
        except Exception as e:
            logger.warning(f"Could not read task state file: {e}")
    
    # For tasks that have just completed, implement a retry mechanism
    max_retries = 5
    if retry_count < max_retries:
        # Check if there are signs that the task is still completing
        if (os.path.exists(public_dir) and not json_exists) or in_packaging_phase:
            # Exponential backoff: 0.5s, 1s, 2s, 4s, 8s
            delay = 0.5 * (2 ** retry_count)
            logger.info(f"Files for task {task_id} not fully available yet. Retrying in {delay}s (attempt {retry_count + 1}/{max_retries})")
            time.sleep(delay)
            # Recursive call with incremented retry count
            return check_result_files(task_id, retry_count + 1)
    
    # If we've exhausted retries or no signs of ongoing completion, return the result
    return zip_exists and json_exists


@routes.route('/torders-results/<string:task_id>', methods=['GET'])
def check_torder_task(task_id):
    """
    Check status and retrieve results for a CoGeTo task.
    This endpoint is specifically designed for CoGeTo tasks and handles
    the unique case where successful tasks have their output files removed.
    
    Args:
        task_id: Task ID to check
        
    Returns:
        JSON response with task status and results
    """
    logger.info(f"--- Entering check_torder_task for task_id: {task_id} ---")
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
            # Check success marker first - this is needed for CoGeTo tasks since they clean up output files
            output_dir = os.path.join(app.config['RESULTS_FOLDER'], task_id, 'output')
            success_marker_path = os.path.join(output_dir, 'task_completed')
            has_success_marker = os.path.exists(success_marker_path)
            
            # Check for task_state.json with success state as alternative indicator
            task_state_file = os.path.join(output_dir, 'task_state.json')
            state_indicates_success = False
            if os.path.exists(task_state_file):
                try:
                    with open(task_state_file, 'r') as f:
                        state_data = json.load(f)
                        if state_data.get('state') == 'success':
                            state_indicates_success = True
                except Exception as e:
                    logger.warning(f"Could not read task state file for {task_id}: {e}")
            
            # If we have a success marker or state indicates success, treat it as successful
            # even if the result files are missing (they might have been cleaned up)
            if has_success_marker or state_indicates_success or (directory_exists(os.path.join(app.config['RESULTS_FOLDER'], task_id)) and check_result_files(task_id)):
                # For downloads, use the torders-specific download endpoint
                download_link = url_for('routes.download_torder_file', task_id=task_id, _external=True, _scheme=app.config['PREFERRED_URL_SCHEME'])
                
                response_data.update({
                    'status': 'success',
                    'link': download_link,
                    'expiresIn': result_data.get('expires_in'),
                    'expiresOn': result_data.get('expires_on'),
                    'createdOn': result_data.get('created_on')
                })
                
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
                in_packaging_phase = False
                if os.path.exists(task_state_file):
                    try:
                        with open(task_state_file, 'r') as f:
                            state_data = json.load(f)
                            if state_data.get('state') == 'packaging':
                                in_packaging_phase = True
                    except Exception as e:
                        logger.warning(f"Could not read task state file: {e}")
                
                # Check if task was created recently (within last 60 seconds)
                recently_created = False
                current_time = int(time.time())
                if os.path.exists(task_state_file):
                    try:
                        with open(task_state_file, 'r') as f:
                            state_data = json.load(f)
                            timestamp = state_data.get('timestamp', 0)
                            if current_time - timestamp < 60:  # Within last 60 seconds
                                recently_created = True
                                logger.info(f"Task {task_id} was created recently ({current_time - timestamp}s ago)")
                    except Exception as e:
                        logger.warning(f"Could not read task state file: {e}")
                
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
        logger.exception(f"--- Uncaught exception in check_torder_task for task_id: {task_id} ---")
        return make_response(jsonify({
            'id': task_id,
            'status': states.FAILURE,
            'errorMessage': "An internal server error occurred.",
            'error_details': str(e) if app.config.get('DEBUG', False) else None
        }), 500)

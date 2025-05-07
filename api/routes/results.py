import logging
from typing import List, Dict, Optional, Union, Any
from dataclasses import dataclass
from flask import url_for, make_response, send_from_directory, jsonify, current_app as app
from flask_api import status
from . import routes
from worker import celery
import celery.states as states
import os
import json

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
    directory = os.path.join(app.config['RESULTS_FOLDER'], task_id)
    if directory_exists(task_id):
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
        else:
            return jsonify({
                'error': 'File not found',
                'message': f'No file found for task ID: {task_id}'
            }), status.HTTP_404_NOT_FOUND
    else:
        return jsonify({
            'error': 'Directory not found',
            'message': f'No results directory found for task ID: {task_id}'
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
                    url_for('static', filename=file_name, _external=True), tail)
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
            url_for('static', filename=file_name, _external=True), tail)
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

def check_result_files(task_id: str) -> bool:
    """
    Check if all required result files exist.
    
    Args:
        task_id: Task ID to check
        
    Returns:
        True if all required files exist, False otherwise
    """
    results_dir = os.path.join(app.config['RESULTS_FOLDER'], task_id)
    public_dir = os.path.join(app.config['PUBLIC_FOLDER'], task_id)
    
    # Check for zip file
    zip_exists = bool(get_filename(results_dir, app.config['OUTPUT_FILE_EXTENSION']))
    
    # Check for results.json
    json_exists = os.path.exists(os.path.join(public_dir, 'results.json'))
    
    return zip_exists and json_exists

@routes.route('/metrical-tree-results/<string:task_id>')
def check_metrical_tree_task(task_id: str) -> Any:
    """
    Check status and retrieve results for a MetricalTree task with restructured response.
    
    Args:
        task_id: Task ID to check
        
    Returns:
        JSON response with task status and results in the expected format
    """
    logger.info(f"--- Entering check_metrical_tree_task for task_id: {task_id} ---")
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
            'data': [],
            'analysis': {},
            'sentences': {},
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
            elif directory_exists(task_id) and check_result_files(task_id):
                response_data.update({
                    'status': 'success',
                    'link': url_for('routes.download_file', task_id=task_id, _external=True),
                    'expiresIn': result_data.get('expires_in'),
                    'expiresOn': result_data.get('expires_on'),
                    'createdOn': result_data.get('created_on')
                })
                
                try:
                    response_data['images'] = get_images(task_id)
                except Exception as e:
                    logger.warning(f"Could not get images for {task_id}: {e}")
                
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
        logger.exception(f"--- Uncaught exception in check_metrical_tree_task for task_id: {task_id} ---")
        return make_response(jsonify({
            'id': task_id,
            'status': states.FAILURE,
            'errorMessage': "An internal server error occurred.",
            'error_details': str(e) if app.config.get('DEBUG', False) else None
        }), 500)


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
            elif directory_exists(task_id) and check_result_files(task_id):
                response_data.update({
                    'status': 'success',
                    'link': url_for('routes.download_file', task_id=task_id, _external=True),
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

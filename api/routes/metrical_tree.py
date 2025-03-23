from flask import url_for, make_response, json, jsonify, request, current_app as app, abort
from . import routes
from worker import celery
import celery.states as states
from flask_expects_json import expects_json
import os
import traceback
import http.client as http_client


schema = {
    'type': 'object',
    'properties': {
        'name': {'type': 'string', "default": ""},
        'description': {'type': 'string', "default": ""},
        'unstressed_words': {'type': 'array', 'items': {'type': 'string'}},
        'unstressed_tags': {'type': 'array', 'items': {'type': 'string'}},
        'unstressed_deps': {'type': 'array', 'items': {'type': 'string'}},
        'ambiguous_words': {'type': 'array', 'items': {'type': 'string'}},
        'ambiguous_tags': {'type': 'array', 'items': {'type': 'string'}},
        'ambiguous_deps': {'type': 'array', 'items': {'type': 'string'}},
        'stressed_words': {'type': 'array', 'items': {'type': 'string'}},
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


def get_param_if_exists(params, param_key):
    if param_key in params:
        return params[param_key]
    else:
        return None


# Add additional input validation
def validate_words_list(word_list, param_name):
    """Validate that a list of words contains only valid strings."""
    if word_list is None:
        return None
    
    if not isinstance(word_list, list):
        return {
            "error": "Invalid parameter type",
            "message": f"Parameter '{param_name}' must be an array of strings",
            "suggestion": "Please provide a proper JSON array for this parameter"
        }
    
    # Filter out invalid entries
    valid_entries = []
    warnings = []
    
    for word in word_list:
        # Skip non-string entries
        if not isinstance(word, str):
            warnings.append({
                "type": "warning",
                "message": f"Skipped non-string entry in '{param_name}'",
                "value": str(word)
            })
            continue
            
        # Skip empty entries
        if not word.strip():
            warnings.append({
                "type": "warning",
                "message": f"Skipped empty entry in '{param_name}'"
            })
            continue
            
        # Valid linguistic tags with special characters
        valid_linguistic_tags = [
            'PRP$', 'WP$', '$', '``', "''", 
            '-LRB-', '-RRB-', '-LSB-', '-RSB-', '-LCB-', '-RCB-'
        ]
        
        # Allow special characters but log a warning (except for known linguistic tags)
        if any(c in word for c in ['|', '>', '<', '&', ';', '$']) and word not in valid_linguistic_tags:
            warnings.append({
                "type": "warning",
                "message": f"Entry in '{param_name}' contains special characters",
                "value": word,
                "note": "This may cause unexpected processing results"
            })
        
        valid_entries.append(word)
    
    # Only return an error if all entries were filtered out
    if len(word_list) > 0 and len(valid_entries) == 0:
        return {
            "error": "No valid entries",
            "message": f"No valid entries found in '{param_name}'",
            "suggestion": "Ensure at least one valid entry is provided",
            "warnings": warnings
        }
    
    # Return warnings if some entries were filtered
    if warnings:
        return {
            "warnings": warnings,
            "valid_entries": valid_entries
        }
    
    return None

@routes.route('/metricaltree/<string:folder_id>', methods=['POST'])
@expects_json(schema, fill_defaults=False)
def compute_metrical_tree(folder_id):
    """
    Handle computation requests for the Metrical Tree.
    
    This endpoint accepts parameters for the metrical tree computation,
    validates them, and dispatches a Celery task to perform the computation.
    """
    try:
        directory = os.path.join(app.config['RESULTS_FOLDER'], folder_id, 'input')
        
        # Check if directory exists
        if not directory_exists(directory):
            error_response = {
                "error": "Input not found",
                "message": f"No file belonging to id: {folder_id} was found",
                "suggestion": "Make sure you've uploaded a file before computing"
            }
            return jsonify(error_response), 404
            
        # Check for input file
        input_filename = get_filename(
            directory, app.config['METRICAL_TREE_ALLOWED_EXTENSIONS'])
            
        if input_filename == '':
            error_response = {
                "error": "No valid file found",
                "message": f"No valid file belonging to id: {folder_id} was found",
                "suggestion": "Make sure your uploaded file has a valid extension (.txt)",
                "code": "file_not_found"
            }
            return jsonify(error_response), 404
            
        # Get and validate parameters
        params = request.get_json()
        
        # Validate word lists for potential issues
        validation_warnings = []
        filtered_params = params.copy()
        
        for param_name in ['unstressed_words', 'unstressed_tags', 'unstressed_deps', 
                          'ambiguous_words', 'ambiguous_tags', 'ambiguous_deps', 
                          'stressed_words']:
            param_value = get_param_if_exists(params, param_name)
            validation_result = validate_words_list(param_value, param_name)
            
            if validation_result:
                # Critical error - no valid entries
                if "error" in validation_result:
                    return jsonify({
                        "error": "Validation Error",
                        "validation_error": validation_result,
                        "message": validation_result["message"],
                        "suggestion": validation_result["suggestion"],
                        "code": "invalid_parameter"
                    }), 400
                
                # Non-critical warning - some entries filtered
                if "warnings" in validation_result:
                    validation_warnings.extend(validation_result["warnings"])
                    # Update the parameter with filtered valid entries
                    if "valid_entries" in validation_result:
                        api_param_name = param_name
                        # Convert from camelCase to snake_case for API
                        if param_name == "unstressedWords":
                            api_param_name = "unstressed_words"
                        elif param_name == "unstressedTags":
                            api_param_name = "unstressed_tags"
                        elif param_name == "unstressedDeps":
                            api_param_name = "unstressed_deps"
                        elif param_name == "ambiguousWords":
                            api_param_name = "ambiguous_words"
                        elif param_name == "ambiguousTags":
                            api_param_name = "ambiguous_tags"
                        elif param_name == "ambiguousDeps":
                            api_param_name = "ambiguous_deps"
                        elif param_name == "stressedWords":
                            api_param_name = "stressed_words"
                            
                        filtered_params[api_param_name] = validation_result["valid_entries"]
            
        # Determine name
        if params['name']:
            name = params['name']
        else:
            name = input_filename

        # Save parameters
        write_script_params_to_file(directory, params)
        input_file_path = os.path.join(directory, input_filename)
        
        # Check file size to prevent very large files
        file_size = os.path.getsize(input_file_path)
        max_size = 10 * 1024 * 1024  # 10MB
        
        if file_size > max_size:
            error_response = {
                "error": "File too large",
                "message": f"Input file exceeds maximum size of 10MB",
                "suggestion": "Please upload a smaller file or use less text"
            }
            return jsonify(error_response), 413
        
        # Dispatch task using filtered parameters
        task = celery.send_task('tasks.compute_metrical_tree', args=[
                                input_file_path,
                                input_filename,
                                get_param_if_exists(filtered_params, 'unstressed_words'),
                                get_param_if_exists(filtered_params, 'unstressed_tags'),
                                get_param_if_exists(filtered_params, 'unstressed_deps'),
                                get_param_if_exists(filtered_params, 'ambiguous_words'),
                                get_param_if_exists(filtered_params, 'ambiguous_tags'),
                                get_param_if_exists(filtered_params, 'ambiguous_deps'),
                                get_param_if_exists(filtered_params, 'stressed_words')], 
                            kwargs={}, 
                            task_id=folder_id)
                                
        # Return response with task info
        link = url_for('routes.check_task', task_id=task.id,
                       _external=True, _scheme='https')
                       
        # Include any validation warnings in the response
        response_data = {
            "id": task.id,
            "name": name,
            "description": params.get('description', ''),
            "status": task.state,
            "link": link,
            "errorMessage": None,
            "params": params
        }
        
        if validation_warnings:
            response_data["warnings"] = validation_warnings
            
        return make_response(jsonify(response_data), 201)
            
    except Exception as e:
        # Log unexpected errors
        app.logger.error(f"Error in compute_metrical_tree: {str(e)}")
        app.logger.error(traceback.format_exc())
        
        # Return error response
        error_response = {
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while processing your request",
            "suggestion": "Please try again or contact support if the problem persists"
        }
        
        return jsonify(error_response), 500

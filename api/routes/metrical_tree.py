from flask import url_for, make_response, json, jsonify, request, current_app as app
from . import routes
from worker import celery
import celery.states as states
from flask_expects_json import expects_json
import os


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


@routes.route('/metricaltree/<string:folder_id>', methods=['POST'])
@expects_json(schema, fill_defaults=False)
def compute_metrical_tree(folder_id):
    directory = os.path.join(app.config['RESULTS_FOLDER'], folder_id, 'input')
    if directory_exists(directory):
        input_filename = get_filename(
            directory, app.config['METRICAL_TREE_ALLOWED_EXTENSIONS'])
        if input_filename != '':
            params = request.get_json()
            if params['name']:
                name = params['name']
            else:
                name = input_filename

            write_script_params_to_file(directory, params)
            input_file_path = os.path.join(directory, input_filename)
            task = celery.send_task('tasks.compute_metrical_tree', args=[
                                    input_file_path,
                                    input_filename,
                                    get_param_if_exists(
                                        params, 'unstressed_words'),
                                    get_param_if_exists(
                                        params, 'unstressed_tags'),
                                    get_param_if_exists(
                                        params, 'unstressed_deps'),
                                    get_param_if_exists(
                                        params, 'ambiguous_words'),
                                    get_param_if_exists(
                                        params, 'ambiguous_tags'),
                                    get_param_if_exists(
                                        params, 'ambiguous_deps'),
                                    get_param_if_exists(params, 'stressed_words')], kwargs={}, task_id=folder_id)
            link = url_for('routes.check_task', task_id=task.id,
                           _external=True, _scheme='https')
            return make_response(jsonify(id=task.id, name=name, description=params['description'], status=task.state, link=link, errorMessage=None, params=params), 201)
        else:
            return 'No file belonging to id: ' + folder_id + ' was found.', HTTP_404_NOT_FOUND
    else:
        return 'No file belonging to id: ' + folder_id + ' was found.', HTTP_404_NOT_FOUND

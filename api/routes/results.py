from flask import url_for, make_response, send_from_directory, jsonify, current_app as app
from flask_api import status
from . import routes
from worker import celery
import celery.states as states
import os
import json

GPRAH_IMAGE_EXTENSION = '.png'


class Image:
    def __init__(self, url, name):
        self.name = name
        self.url = url


def get_filename(directory, extension):
    filename = ''
    for file in os.listdir(directory):
        if file.endswith(extension):
            filename = file
            break
    return filename


def directory_exists(folder_id):
    directory = os.path.join(app.config['RESULTS_FOLDER'], folder_id)
    return os.path.exists(directory)


@routes.route('/results/<string:task_id>/$value', methods=['GET'])
def download_file(task_id):
    directory = os.path.join(app.config['RESULTS_FOLDER'], task_id)
    if directory_exists(task_id):
        zip_filename = get_filename(
            directory, app.config['OUTPUT_FILE_EXTENSION'])
        if zip_filename != '':
            return send_from_directory(directory, zip_filename, as_attachment=True)
        else:
            return 'No file belonging to id: ' + task_id + ' was found.', HTTP_404_NOT_FOUND
    else:
        return 'No file belonging to id: ' + task_id + ' was found.', HTTP_404_NOT_FOUND


def get_all_file_paths(directory):
    file_paths = []
    for root, directories, files in os.walk(directory):
        for filename in files:
            filepath = os.path.abspath(os.path.join(root, filename))
            file_paths.append(filepath)

    return file_paths


def get_images(folder_id):
    images = []
    image_directory = os.path.join(app.config['PUBLIC_FOLDER'], folder_id)
    file_paths = get_all_file_paths(image_directory)
    for index, file in enumerate(file_paths):
        if file.endswith(GPRAH_IMAGE_EXTENSION):
            head, tail = os.path.split(file)
            file_name = os.path.join(folder_id, tail)
            image = Image(
                url_for('static', filename=file_name, _external=True, _scheme='https'), tail)
            images.append(image.__dict__)
    return images


@routes.route('/results/<string:task_id>')
def check_task(task_id: str) -> str:
    res = celery.AsyncResult(task_id)
    status = res.state
    link = None
    errorMessage = None
    expiresOn = None
    expiresIn = None
    images = []
    if res.state == states.SUCCESS:
        if directory_exists(task_id):
            link = url_for('routes.download_file',
                           task_id=task_id, _external=True, _scheme='https')
            result = json.loads(res.result)
            expiresIn = result['expires_in']
            expiresOn = result['expires_on']
            images = get_images(task_id)
        else:
            status = 'EXPIRED'
            result = json.loads(res.result)
            expiresIn = result['expires_in']
            expiresOn = result['expires_on']

    if res.state == states.PENDING:
        if directory_exists(task_id):
            directory = os.path.join(app.config['RESULTS_FOLDER'], folder_id)
            zip_filename = get_filename(
                directory, app.config['OUTPUT_FILE_EXTENSION'])
            if zip_filename != '':
                status = SUCCESS
                link = url_for('routes.download_file',
                               task_id=task_id, _external=True, _scheme='https')
        else:
            status = 'EXPIRED'

    if res.state == states.FAILURE:
        errorMessage = str(res.result)

    return make_response(jsonify(id=task_id, status=status, link=link, expiresIn=expiresIn, expiresOn=expiresOn, errorMessage=errorMessage, images=images), 200)

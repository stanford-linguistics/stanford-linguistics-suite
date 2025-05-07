import os
import zipfile
import shutil
import csv
import json
import logging

from shared.error_handling import (
    SystemException,
    ErrorCode
)

PUBLIC_FOLDER = '/public'
RESULTS_FOLDER = '/results'
GRAPH_IMAGE_EXTENSION = '.png'

# Configure logging
logger = logging.getLogger(__name__)

def create_directory(directory):
    """
    Create a directory if it doesn't exist.
    
    Args:
        directory: Path to create
        
    Raises:
        SystemException: If directory cannot be created
    """
    try:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logger.info("Created directory: {}".format(directory))
    except OSError as e:
        raise SystemException(
            message="Failed to create directory: {}".format(directory),
            error_code=ErrorCode.FILE_SYSTEM_ERROR,
            details={'error': str(e)},
            suggestion="Check system permissions and disk space"
        )

def get_all_file_paths(directory):
    file_paths = []
    for root, directories, files in os.walk(directory):
        for filename in files:
            filepath = os.path.abspath(os.path.join(root, filename))
            file_paths.append(filepath)

    return file_paths


def copy_graphs(results_directory, folder_id):
    """
    Copy graph images from results directory to public folder.
    
    Args:
        results_directory: Source directory containing graph images
        folder_id: Task folder ID
        
    Raises:
        SystemException: If copy operation fails
    """
    if not os.path.exists(results_directory):
        raise SystemException(
            message="Results directory not found: {}".format(results_directory),
            error_code=ErrorCode.FILE_NOT_FOUND,
            suggestion="Ensure the metrical tree computation completed successfully"
        )

    public_folder = os.path.join(PUBLIC_FOLDER, folder_id)
    create_directory(public_folder)
    logger.info("Copying graphs to public folder: {}".format(public_folder))

    try:
        file_paths = get_all_file_paths(results_directory)
        copied = 0
        for file in file_paths:
            if file.endswith(GRAPH_IMAGE_EXTENSION):
                shutil.copy(file, public_folder)
                copied += 1
        
        if copied == 0:
            logger.warning("No graph images found in {}".format(results_directory))
        else:
            logger.info("Copied {} graph images to {}".format(copied, public_folder))
    except (IOError, OSError) as e:
        raise SystemException(
            message="Failed to copy graph files: {}".format(str(e)),
            error_code=ErrorCode.FILE_SYSTEM_ERROR,
            suggestion="Check file permissions and disk space"
        )

def copy_results_to_json(results_directory, folder_id):
    """
    Convert CSV results to JSON and copy to public folder.
    
    Args:
        results_directory: Source directory containing results.csv
        folder_id: Task folder ID
        
    Raises:
        SystemException: If conversion or copy fails
    """
    if not os.path.exists(results_directory):
        raise SystemException(
            message="Results directory not found: {}".format(results_directory),
            error_code=ErrorCode.FILE_NOT_FOUND,
            suggestion="Ensure the metrical tree computation completed successfully"
        )

    public_folder = os.path.join(PUBLIC_FOLDER, folder_id)
    create_directory(public_folder)
    logger.info("Converting results to JSON in: {}".format(public_folder))

    csv_file_path = os.path.join(results_directory, 'results.csv')
    json_file_path = os.path.join(public_folder, 'results.json')

    if not os.path.exists(csv_file_path):
        raise SystemException(
            message="Results file not found: {}".format(csv_file_path),
            error_code=ErrorCode.FILE_NOT_FOUND,
            suggestion="Check if the metrical tree computation generated results"
        )

    try:
        jsonArray = []
        with open(csv_file_path) as csvf:
            csvReader = csv.DictReader(csvf)
            for row in csvReader:
                jsonArray.append(row)

        with open(json_file_path, 'w') as jsonf:
            jsonString = json.dumps(jsonArray, indent=4)
            jsonf.write(jsonString)
            
        logger.info("Successfully converted results to JSON: {}".format(json_file_path))
    except (IOError, csv.Error, json.JSONDecodeError) as e:
        raise SystemException(
            message="Failed to convert results to JSON: {}".format(str(e)),
            error_code=ErrorCode.FILE_SYSTEM_ERROR,
            details={'error': str(e)},
            suggestion="Check if the CSV file is properly formatted"
        )


def zip_all(directory, zip_name):
    """
    Create a zip archive of all files in a directory.
    
    Args:
        directory: Directory to zip
        zip_name: Name of the zip file
        
    Raises:
        SystemException: If zip operation fails
    """
    if not os.path.exists(directory):
        raise SystemException(
            message="Directory not found: {}".format(directory),
            error_code=ErrorCode.FILE_NOT_FOUND,
            suggestion="Ensure the directory exists before zipping"
        )

    try:
        root_directory = os.path.abspath(directory)
        file_paths = get_all_file_paths(directory)
        zip_path = os.path.join(directory, zip_name)
        
        logger.info("Creating zip archive: {}".format(zip_path))
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip:
            for file in file_paths:
                arc_name = file[len(root_directory) + 1:]
                zip.write(file, arc_name)
        
        logger.info("Successfully created zip archive with {} files".format(len(file_paths)))
    except (IOError, zipfile.BadZipFile) as e:
        raise SystemException(
            message="Failed to create zip archive: {}".format(str(e)),
            error_code=ErrorCode.FILE_SYSTEM_ERROR,
            details={'error': str(e)},
            suggestion="Check disk space and file permissions"
        )

def clean_directory(directory):
    """
    Remove a directory and all its contents.
    
    Args:
        directory: Directory to remove
        
    Raises:
        SystemException: If directory removal fails
    """
    if os.path.exists(directory):
        try:
            shutil.rmtree(directory)
            logger.info("Successfully removed directory: {}".format(directory))
        except OSError as e:
            raise SystemException(
                message="Failed to remove directory: {}".format(directory),
                error_code=ErrorCode.FILE_SYSTEM_ERROR,
                details={'error': str(e)},
                suggestion="Check file permissions and ensure no files are in use"
            )


def get_output_path(folder_id):
    """
    Get the path to the 'output' subdirectory within a specific task's results folder.
    
    Args:
        folder_id: Task folder ID
        
    Returns:
        Path to the output directory
    """
    return os.path.join(RESULTS_FOLDER, folder_id, 'output')

def get_task_results_path(folder_id):
    """
    Get the path to a specific task's main results folder.
    
    Args:
        folder_id: Task folder ID
        
    Returns:
        Path to the task's results directory
    """
    return os.path.join(RESULTS_FOLDER, folder_id)

def get_graphs_path(folder_id):
    """
    Get the path where public graph files for a task should be stored.
    
    Args:
        folder_id: Task folder ID
        
    Returns:
        Path to the public graphs directory
    """
    return os.path.join(PUBLIC_FOLDER, folder_id)

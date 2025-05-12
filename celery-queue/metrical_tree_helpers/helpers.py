import os
import glob
import logging
import subprocess32 as subprocess
import pipes

from shared.error_handling import (
    capture_exception, InputValidationException,
    LinguisticProcessingException, SystemException, ComputationalException,
    CLIProcessingException, ErrorCode
)

from shared.utils import get_safe_list
from shared.results_helper import get_output_path

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def verify_metrical_tree_results(folder_id):
    """
    Verify metrical tree results exist and are valid.
    
    Args:
        folder_id: Task folder ID
        
    Raises:
        SystemException: If results.csv is missing
    """
    # Primary expected path
    results_path = os.path.join(get_output_path(folder_id), 'results.csv')
    results_path = os.path.normpath(results_path)  # Normalize path to handle any path format differences
    
    logger.info("Checking for results.csv at path: {}".format(results_path))
    
    # Add a small delay to allow for filesystem sync
    import time
    time.sleep(0.5)
    
    # If the primary path exists, we're good
    if os.path.exists(results_path):
        logger.info("Verified results.csv exists at expected path: {}".format(results_path))
        return
        
    # If not, let's try some alternate locations and provide detailed error info
    logger.warning("Results file not found at primary path: {}".format(results_path))
    
    # Alternative path patterns to check
    possible_paths = [
        results_path,
        os.path.normpath(os.path.join('/results', folder_id, 'output', 'results.csv')),
        os.path.normpath(os.path.join('/results', folder_id, 'results.csv')),
    ]
    
    # Log directory contents for debugging
    output_dir = os.path.dirname(results_path)
    if os.path.exists(output_dir):
        logger.info("Contents of output directory {}:".format(output_dir))
        try:
            for item in os.listdir(output_dir):
                item_path = os.path.join(output_dir, item)
                if os.path.isfile(item_path):
                    logger.info("  - File: {} ({} bytes)".format(item, os.path.getsize(item_path)))
                else:
                    logger.info("  - Directory: {}".format(item))
        except Exception as e:
            logger.error("Error listing directory contents: {}".format(str(e)))
    else:
        logger.warning("Output directory does not exist: {}".format(output_dir))
    
    found_paths = []
    for test_path in possible_paths:
        if os.path.exists(test_path):
            found_paths.append((test_path, os.path.getsize(test_path)))
            
    # Check if we found results.csv in any alternate location
    if found_paths:
        # If we found it somewhere else, log the details but don't move it - we should fix
        # the source of the problem instead of implementing a workaround
        logger.warning("Results file found at alternate location(s): {}".format(found_paths))
        
    # Look for any CSV files as a last resort
    csv_files = []
    for root, dirs, files in os.walk(os.path.dirname(output_dir)):
        for file in files:
            if file.endswith('.csv'):
                full_path = os.path.join(root, file)
                csv_files.append((full_path, os.path.getsize(full_path)))
                
    if csv_files:
        logger.warning("Found other CSV files in output directory: {}".format(csv_files))
    
    # Raise the exception with enhanced details
    raise SystemException(
        message="Metrical tree script did not generate required results.csv file",
        error_code=ErrorCode.FILE_NOT_FOUND,
        details={
            "expected_path": results_path,
            "output_directory": output_dir,
            "alternate_paths_checked": possible_paths,
            "found_csv_files": csv_files,
            "directory_exists": os.path.exists(output_dir),
            "parent_directory_exists": os.path.exists(os.path.dirname(output_dir)),
            "folder_id": folder_id
        },
        suggestion="Check metrical tree script for possible Python import errors or bugs"
    )

def ensure_directory(path):
    """
    Ensure a directory exists and is writable.
    
    Args:
        path: Directory path to verify/create
        
    Raises:
        SystemException: If directory cannot be created or is not writable
    """
    try:
        if not os.path.exists(path):
            os.makedirs(path)
        
        # Verify directory is writable
        test_file = os.path.join(path, '.write_test')
        try:
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
        except (IOError, OSError) as e:
            raise SystemException(
                message="Directory {} is not writable".format(path),
                error_code=ErrorCode.PERMISSION_DENIED,
                details={'error': str(e)},
                suggestion="Check directory permissions"
            )
    except OSError as e:
        raise SystemException(
            message="Failed to create/verify directory: {}".format(path),
            error_code=ErrorCode.FILE_SYSTEM_ERROR,
            details={'error': str(e)},
            suggestion="Check system permissions and disk space"
        )


def get_metrical_tree_optional_args(unstressed_words, unstressed_tags, unstressed_deps, ambiguous_words, ambiguous_tags, ambiguous_deps, stressed_words):
    """Builds the optional arguments string for the metricaltree script."""
    args_string = ''
    # Use locally defined get_safe_list and get_safe_string
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
def call_metrical_tree(input_file_path, output_path, unstressed_words, unstressed_tags, 
                      unstressed_deps, ambiguous_words, ambiguous_tags, 
                      ambiguous_deps, stressed_words):
    """
    Execute the metrical tree script with the provided parameters.

    This function is wrapped with the capture_exception decorator to standardize error handling.
    
    Args:
        input_file_path: Path to input file
        output_path: Path for output files
        unstressed_words: List of unstressed words
        unstressed_tags: List of unstressed tags
        unstressed_deps: List of unstressed dependencies
        ambiguous_words: List of ambiguous words
        ambiguous_tags: List of ambiguous tags
        ambiguous_deps: List of ambiguous dependencies
        stressed_words: List of stressed words
        
    Raises:
        Various exceptions based on error conditions
    """
    logger.info("Starting metrical tree computation", extra={
        'input_file': input_file_path,
        'output_path': output_path
    })

    # Validate input file exists and is accessible
    if not os.path.exists(input_file_path):
        raise SystemException(
            message="Input file not found: {}".format(input_file_path),
            error_code=ErrorCode.FILE_NOT_FOUND,
            suggestion="Ensure the uploaded file was saved correctly."
        )
    
    # Ensure output directory exists and is writable
    output_dir = os.path.dirname(output_path)
    ensure_directory(output_dir)

    # Validate input file
    try:
        file_size = os.path.getsize(input_file_path)
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            raise InputValidationException(
                message="Input file is too large",
                error_code=ErrorCode.INPUT_TOO_LARGE,
                details={'file_size': file_size},
                suggestion="Please use a smaller text file (under 10MB)."
            )
        if file_size == 0:
            raise InputValidationException(
                message="Input file is empty",
                error_code=ErrorCode.EMPTY_INPUT,
                suggestion="Please provide a non-empty text file."
            )
    except OSError as e:
        raise SystemException(
            message="Could not access input file: {}".format(str(e)),
            error_code=ErrorCode.FILE_NOT_FOUND,
            suggestion="Ensure the file exists and is accessible."
        )

    # Build command
    optional_args = get_metrical_tree_optional_args(
        unstressed_words, unstressed_tags, unstressed_deps, ambiguous_words,
        ambiguous_tags, ambiguous_deps, stressed_words)

    metrical_tree_command = 'python2 metrical-tree/metricaltree.py --input-file {} ' \
                           '--output {} {}'.format(pipes.quote(input_file_path),
                                                 pipes.quote(output_path), optional_args)

    logger.info("Executing metrical tree command", extra={'command': metrical_tree_command})

    # Execute with timeout and capture both stdout and stderr
    try:
        process = subprocess.Popen(
            metrical_tree_command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        try:
            stdout, stderr = process.communicate(timeout=300)  # 5 minute timeout
            return_code = process.returncode
            
            # Log output at INFO level with full output for debugging
            logger.info("Command output - return code: {}".format(return_code))
            
            # Log stdout in manageable chunks to avoid log truncation
            if stdout:
                logger.info("STDOUT START ----------------------------")
                for i in range(0, len(stdout), 1000):
                    logger.info(stdout[i:i+1000])
                logger.info("STDOUT END ------------------------------")
            
            # Log stderr in manageable chunks to avoid log truncation
            if stderr:
                logger.info("STDERR START ----------------------------")
                for i in range(0, len(stderr), 1000):
                    logger.info(stderr[i:i+1000])
                logger.info("STDERR END ------------------------------")
                
        except subprocess.TimeoutExpired:
            process.kill()
            raise CLIProcessingException(
                message="Metrical tree computation timed out",
                error_code=ErrorCode.CLI_TIMEOUT_ERROR,
                details={"timeout": 300},
                suggestion="Try processing a smaller text sample."
            )
            
        # Explicitly check for results.csv even if return code is 0
        # Use the exact same output path where metricaltree.py writes the file (without dirname)
        results_file = os.path.join(output_path, 'results.csv')
        results_file = os.path.normpath(results_file)
        
        # Add a small delay to allow for filesystem sync
        import time
        time.sleep(0.5)
        
        logger.info("Checking for results file at: {}".format(results_file))
        logger.info("Output path provided to metricaltree.py: {}".format(output_path))
        
        # List directory contents for debugging
        output_dir = os.path.dirname(results_file)
        if os.path.exists(output_dir):
            logger.info("Contents of output directory {}:".format(output_dir))
            try:
                for item in os.listdir(output_dir):
                    item_path = os.path.join(output_dir, item)
                    if os.path.isfile(item_path):
                        logger.info("  - File: {} ({} bytes)".format(item, os.path.getsize(item_path)))
                    else:
                        logger.info("  - Directory: {}".format(item))
            except Exception as e:
                logger.error("Error listing directory contents: {}".format(str(e)))
        
        if return_code == 0 and not os.path.exists(results_file):
            logger.error("Command returned success but results.csv not found", extra={
                'output_dir': os.path.dirname(output_path),
                'results_file_path': results_file,
                'full_stdout': stdout,
                'full_stderr': stderr
            })
            raise SystemException(
                message="Metrical tree script did not generate required results.csv file",
                error_code=ErrorCode.FILE_NOT_FOUND,
                details={
                    "output_path": output_path,
                    "results_file_path": results_file,
                    "command": metrical_tree_command,
                    "stdout": stdout,
                    "stderr": stderr,
                    "directory_exists": os.path.exists(os.path.dirname(results_file))
                },
                suggestion="Check metrical tree script for possible Python import errors or bugs"
            )
        elif return_code == 0:
            logger.info("Successfully verified results.csv exists: {} ({} bytes)".format(
                results_file, os.path.getsize(results_file)))
        elif return_code != 0:
            error_output = stderr or stdout
            
            # Analyze error output for specific issues
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
            elif "Permission denied" in error_output:
                raise SystemException(
                    message="Permission denied while executing metrical tree script",
                    error_code=ErrorCode.PERMISSION_DENIED,
                    details={"error_output": error_output},
                    suggestion="Check file and directory permissions."
                )
            else:
                raise CLIProcessingException(
                    message="Error executing metrical tree script",
                    error_code=ErrorCode.CLI_EXECUTION_ERROR,
                    details={
                        "error_output": error_output,
                        "return_code": return_code,
                        "command": metrical_tree_command
                    },
                    suggestion="Check the error details and try again."
                )
                
    except OSError as e:
        raise SystemException(
            message="Failed to execute metrical tree script: {}".format(str(e)),
            error_code=ErrorCode.CLI_EXECUTION_ERROR,
            details={"error": str(e)},
            suggestion="Check if the metrical tree script exists and is executable."
        )

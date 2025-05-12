from __future__ import division
import os
import logging
import traceback
import io
import json
import csv
import time

from shared.results_helper import get_output_path, create_directory
from shared.error_handling import SystemException, ErrorCode
from metrical_tree_helpers.enhancer_utils import (
    rename_and_backup_original,
    cleanup_temp_files
)
from metrical_tree_helpers.csv_processors import (
    build_data_indexes,
    process_and_write_results,
    create_sentences_csv
)
from metrical_tree_helpers.contour_analyzer import (
    generate_analysis_summary
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def copy_enhanced_results_to_json(results_directory, folder_id):
    """
    Combine data from results.csv, sentences.csv, and analysis_summary.json
    into structured JSON files for frontend consumption.
    For large datasets, creates separate metadata and summary files.
    
    Args:
        results_directory: Source directory containing result files
        folder_id: Task folder ID
        
    Raises:
        SystemException: If conversion or copy fails
    """
    PUBLIC_FOLDER = '/public'
    
    # Define file paths
    results_csv_path = os.path.join(results_directory, 'results.csv')
    sentences_csv_path = os.path.join(results_directory, 'sentences.csv')
    analysis_json_path = os.path.join(results_directory, 'analysis_summary.json')
    
    # Define output paths
    public_folder = os.path.join(PUBLIC_FOLDER, folder_id)
    create_directory(public_folder)
    enhanced_json_path = os.path.join(public_folder, 'results.json')
    metadata_json_path = os.path.join(public_folder, 'metadata.json')
    summary_json_path = os.path.join(public_folder, 'results_summary.json')
    
    logging.info("Combining enhanced results to JSON in: %s", public_folder)
    
    # Initialize data structures
    combined_data = {
        "data": [],
        "sentences": {},
        "analysis": {}
    }
    
    # Track dataset size
    data_size = 0
    is_large_dataset = False
    LARGE_DATASET_THRESHOLD = 5000  # Define threshold for large datasets
    
    try:
        # 1. Read and process results.csv (word-level data into "data" property)
        if os.path.exists(results_csv_path):
            with io.open(results_csv_path, 'r', encoding='utf-8') as csvf:
                csv_reader = csv.DictReader(csvf)
                # First pass: count rows to determine if it's a large dataset
                rows = list(csv_reader)
                data_size = len(rows)
                is_large_dataset = data_size > LARGE_DATASET_THRESHOLD
                
                logging.info("Dataset size: %d rows (large dataset: %s)", data_size, "Yes" if is_large_dataset else "No")
                
                # Process all rows
                for row in rows:
                    # Convert numeric fields to appropriate types
                    for key in row:
                        if key in ['word_freq', 'prev_word_freq']:
                            try:
                                row[key] = int(row[key])
                            except (ValueError, TypeError):
                                row[key] = 0
                    combined_data["data"].append(row)
        else:
            logging.warning("Results CSV not found: %s", results_csv_path)
        
        # 2. Read and process sentences.csv (sentence-level data)
        if os.path.exists(sentences_csv_path):
            with io.open(sentences_csv_path, 'r', encoding='utf-8') as csvf:
                csv_reader = csv.DictReader(csvf)
                for row in csv_reader:
                    # Convert numeric fields to appropriate types
                    for key in row:
                        if key.startswith('contourMetrics_'):
                            try:
                                row[key] = float(row[key])
                            except (ValueError, TypeError):
                                row[key] = 0.0
                    
                    # Use sidx as the key in the sentences dictionary
                    sidx = row.get('sidx', '')
                    if sidx:
                        combined_data["sentences"][sidx] = row
        else:
            logging.warning("Sentences CSV not found: %s", sentences_csv_path)
        
        # 3. Read and process analysis_summary.json
        if os.path.exists(analysis_json_path):
            with io.open(analysis_json_path, 'r', encoding='utf-8') as jsonf:
                analysis_data = json.load(jsonf)
                combined_data["analysis"] = analysis_data
        else:
            logging.warning("Analysis JSON not found: %s", analysis_json_path)
        
        # 4. Create metadata file with dataset size information
        metadata = {
            "dataSize": data_size,
            "isLargeDataset": is_large_dataset,
            "threshold": LARGE_DATASET_THRESHOLD,
            "createdAt": int(time.time())
        }
        
        with io.open(metadata_json_path, 'w', encoding='utf-8') as jsonf:
            json_str = json.dumps(metadata, indent=4, ensure_ascii=False)
            if isinstance(json_str, str):  # In Python 2, str is bytes
                json_str = json_str.decode('utf-8')
            jsonf.write(json_str)
        
        # 5. For large datasets, create a summary file without the full data array
        if is_large_dataset:
            summary_data = {
                "analysis": {},
                "dataSize": data_size,
                "isLargeDataset": True
            }
            
            with io.open(summary_json_path, 'w', encoding='utf-8') as jsonf:
                json_str = json.dumps(summary_data, indent=4, ensure_ascii=False)
                if isinstance(json_str, str):  # In Python 2, str is bytes
                    json_str = json_str.decode('utf-8')
                jsonf.write(json_str)
            
            logging.info("Created summary JSON for large dataset (%d rows) at: %s", 
                        data_size, summary_json_path)
        
        # 6. Always write the full results.json for download purposes
        with io.open(enhanced_json_path, 'w', encoding='utf-8') as jsonf:
            # Convert to JSON string with proper encoding for Python 2
            # ensure_ascii=False ensures that Unicode characters are preserved
            json_str = json.dumps(combined_data, indent=4, ensure_ascii=False)
            
            # In Python 2, we need to handle the string type correctly
            # If json_str is already unicode, use it directly
            # If it's a str (bytes), decode it to unicode first
            if isinstance(json_str, str):  # In Python 2, str is bytes
                json_str = json_str.decode('utf-8')
            
            # Now write the unicode string directly
            jsonf.write(json_str)
        
        logging.info("Successfully created enhanced results JSON at: %s", enhanced_json_path)
        
    except IOError as e:
        raise SystemException(
            message="Failed to process result files: {}".format(str(e)),
            error_code=ErrorCode.FILE_SYSTEM_ERROR,
            details={'error': str(e)},
            suggestion="Check file permissions and ensure files exist"
        )
    except (csv.Error, ValueError) as e:
        # Handle Unicode in error message by ensuring it's properly encoded
        error_str = str(e)
        # Safely encode error message for Python 2 if it contains Unicode
        try:
            # If it's a unicode object, we need to encode it safely
            if isinstance(error_str, unicode):  # noqa: F821
                error_str = error_str.encode('utf-8', 'replace')
        except NameError:  # In case of Python 3 where unicode type doesn't exist
            pass
            
        raise SystemException(
            message="Failed to parse CSV data: {}".format(error_str),
            error_code=ErrorCode.CLI_OUTPUT_PARSING_ERROR,
            details={'error': error_str},
            suggestion="Check if CSV files are properly formatted"
        )
    except (TypeError, ValueError) as e:
        raise SystemException(
            message="Failed to process data: {}".format(str(e)),
            error_code=ErrorCode.COMPUTATION_FAILED,
            details={'error': str(e)},
            suggestion="Check data types and formats in result files"
        )
    except Exception as e:
        raise SystemException(
            message="Unexpected error creating enhanced results JSON: {}".format(str(e)),
            error_code=ErrorCode.UNEXPECTED_ERROR,
            details={'error': str(e)},
            suggestion="Check logs for detailed error information"
        )

def enhance_metrical_tree_results(folder_id):
    """
    Reads the raw results.csv, performs indexing, calculates row enhancements,
    writes enhanced CSV, and generates JSON summary.
    """
    output_dir = get_output_path(folder_id)
    
    # Define file paths
    original_csv_path = os.path.join(output_dir, 'results.csv')
    raw_csv_path = os.path.join(output_dir, 'raw_results.csv')
    sentences_csv_path = os.path.join(output_dir, 'sentences.csv')
    analysis_json_path = os.path.join(output_dir, 'analysis_summary.json')
    
    logging.info("Starting enhancement process for task ID: %s", folder_id)
    
    try:
        # Step 1: Rename original file to raw_results.csv
        rename_and_backup_original(original_csv_path, raw_csv_path)
        
        # Step 2: Build indexes from raw data
        word_counts, lowercase_word_counts, sentence_map, header, column_indices = build_data_indexes(raw_csv_path)
        
        # Step 3: Process and write enhanced results.csv
        process_and_write_results(raw_csv_path, original_csv_path, 
                                word_counts, lowercase_word_counts, sentence_map, header, column_indices)
        
        # Step 4: Create sentences.csv and store contour analysis in sentence_map
        create_sentences_csv(sentences_csv_path, sentence_map)
        
        # Step 5: Generate enhanced analysis summary using sentence_map data and lowercase word counts
        generate_analysis_summary(analysis_json_path, word_counts, sentence_map, lowercase_word_counts)
        
        # Step 6: Delete raw_results.csv
        cleanup_temp_files(raw_csv_path)
        
        logging.info("Enhancement process completed successfully for task %s", folder_id)
        
        # Create combined enhanced JSON
        copy_enhanced_results_to_json(output_dir, folder_id)
        
    except IOError as e:
        logging.error("IOError in enhancement process: %s", str(e))
        logging.error(traceback.format_exc())
        raise
    except Exception as e:
        logging.error("Error in enhancement process: %s", str(e))
        logging.error(traceback.format_exc())
        raise

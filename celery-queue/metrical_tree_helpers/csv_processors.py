from __future__ import division
import csv
import io
import logging
import collections
import traceback

from metrical_tree_helpers.enhancer_utils import encode_item_py2
from metrical_tree_helpers.contour_analyzer import analyze_contour_pattern_py

def build_data_indexes(raw_csv_path):
    """
    Build word counts and sentence map from raw CSV.
    Python 2 compatible implementation.
    """
    word_counts = collections.Counter()
    sentence_map = collections.defaultdict(dict)
    header = []
    column_indices = {'sidx': -1, 'widx': -1, 'word': -1, 'contour': -1, 'sent': -1}
    
    try:
        with io.open(raw_csv_path, 'r', encoding='utf-8') as infile:
            reader = csv.reader(infile)
            try:
                header = next(reader)
                logging.info("Successfully read header from %s", raw_csv_path)
            except StopIteration:
                logging.error("CSV file is empty: %s", raw_csv_path)
                raise IOError("CSV file is empty")

            # Find required column indices
            for col_name in column_indices:
                try:
                    column_indices[col_name] = header.index(col_name)
                except ValueError:
                    logging.error("Missing required column '%s' in %s", col_name, raw_csv_path)
                    raise ValueError("Missing required column: " + col_name)
            
            # Process rows to build indexes
            row_count = 0
            sentence_first_words = {}  # Track first word index for each sentence
            
            for row in reader:
                row_count += 1
                try:
                    word_raw = row[column_indices['word']]
                    if isinstance(word_raw, bytes):
                        try:
                            word = word_raw.decode('utf-8')
                        except UnicodeDecodeError:
                            logging.warning("Skipping row %d due to UTF-8 decode error for word.", row_count + 1)
                            continue
                    else:
                        word = word_raw

                    sidx = int(row[column_indices['sidx']])
                    widx = int(row[column_indices['widx']])
                    word_counts[word] += 1
                    sentence_map[sidx][widx] = word

                    # Store sentence and contour data for the first word of each sentence
                    # Track the first word we see for each sentence (lowest widx)
                    if sidx not in sentence_first_words or widx < sentence_first_words[sidx]:
                        sentence_first_words[sidx] = widx
                        sentence_map[sidx]['sent'] = row[column_indices['sent']]
                        sentence_map[sidx]['contour'] = row[column_indices['contour']]

                except IndexError:
                    logging.warning("Skipping row %d due to missing columns.", row_count + 1)
                    continue
                except ValueError:
                    logging.warning("Skipping row %d due to non-integer sidx/widx.", row_count + 1)
                    continue
                except Exception as e:
                    logging.warning("Skipping row %d during indexing due to unexpected error: %s", row_count + 1, e)
                    continue

            sentences_with_data = sum(1 for sent_data in sentence_map.values() 
                                    if isinstance(sent_data, dict) and 'sent' in sent_data and 'contour' in sent_data)
            
            logging.info("Successfully processed %d data rows for indexing", row_count)
            logging.info("Collected sentence data for %d sentences", sentences_with_data)
            
    except IOError as e:
        logging.error("IOError reading raw results file %s: %s", raw_csv_path, e)
        raise
    except csv.Error as e:
        logging.error("CSV Error reading raw results file %s: %s", raw_csv_path, e)
        raise
    except Exception as e:
        logging.error("Unexpected error during file processing or indexing for %s: %s", raw_csv_path, e)
        logging.error(traceback.format_exc())
        raise
        
    return word_counts, sentence_map, header, column_indices

def process_and_write_results(raw_path, output_path, word_counts, sentence_map, header, column_indices):
    """
    Process raw CSV and write enhanced results CSV.
    """
    excluded_columns = ['sent', 'contour']
    
    # Get filtered header (excluding sent and contour)
    filtered_header = [col for col in header if col not in excluded_columns]
    
    # Add enhancement columns
    enhanced_header = filtered_header + ['wordFrequency', 'prevWord', 'prevWordFrequency']
    
    try:
        with io.open(raw_path, 'r', encoding='utf-8') as infile, \
             io.open(output_path, 'wb') as outfile:
            reader = csv.reader(infile)
            writer = csv.writer(outfile)
            
            # Skip header in input file
            next(reader)
            
            # Write enhanced header
            writer.writerow([encode_item_py2(h) for h in enhanced_header])
            
            # Process rows
            row_count = 0
            for row in reader:
                row_count += 1
                try:
                    # Get word and its frequency
                    word = row[column_indices['word']]
                    if isinstance(word, bytes):
                        word = word.decode('utf-8', 'replace')
                    frequency = word_counts.get(word, 0)
                    
                    # Get previous word and its frequency
                    sidx = int(row[column_indices['sidx']])
                    widx = int(row[column_indices['widx']])
                    prev_word = sentence_map.get(sidx, {}).get(widx - 1, '')
                    prev_frequency = word_counts.get(prev_word, 0) if prev_word else 0
                    
                    # Create filtered row (excluding sent and contour)
                    filtered_row = [row[i] for i, col in enumerate(header) if col not in excluded_columns]
                    
                    # Add enhancements
                    enhanced_row = filtered_row + [
                        frequency,
                        prev_word if prev_word is not None else '',
                        prev_frequency
                    ]
                    
                    writer.writerow([encode_item_py2(item) for item in enhanced_row])
                    
                except (IndexError, ValueError) as e:
                    logging.warning("Error processing row %d: %s", row_count, e)
                    continue
                except Exception as e:
                    logging.error("Unexpected error processing row %d: %s", row_count, e)
                    logging.error(traceback.format_exc())
                    continue
                    
        logging.info("Successfully wrote enhanced results CSV with %d rows", row_count)
        
    except IOError as e:
        logging.error("IOError processing results CSV: %s", e)
        raise
    except csv.Error as e:
        logging.error("CSV Error processing results: %s", e)
        raise
    except Exception as e:
        logging.error("Unexpected error processing results: %s", e)
        logging.error(traceback.format_exc())
        raise

def create_sentences_csv(output_path, sentence_map):
    """
    Create sentences CSV with required columns.
    Stores contour analysis results in sentence_map for later use.
    """
    # Define sentences CSV header
    sentence_header = ['sidx', 'sent', 'contourPattern', 'contourValues', 
                      'contourMetrics_max', 'contourMetrics_min', 'contourMetrics_range', 
                      'contourMetrics_mean', 'contourMetrics_median', 'contourMetrics_stdDev']
    
    try:
        with io.open(output_path, 'wb') as outfile:
            writer = csv.writer(outfile)
            writer.writerow([encode_item_py2(h) for h in sentence_header])
            
            for sidx in sorted(sentence_map.keys()):
                sent_data = sentence_map[sidx]
                if isinstance(sent_data, dict) and 'sent' in sent_data and 'contour' in sent_data:
                    try:
                        contour_analysis = analyze_contour_pattern_py(sent_data['contour'])
                        
                        # Store analysis results in sentence_map for later use
                        sent_data['contourAnalysis'] = contour_analysis
                    except Exception as e:
                        logging.error("Error analyzing contour pattern for sentence %s: %s", sidx, e)
                        logging.error("Contour data: %s", sent_data['contour'])
                        # Use default analysis to avoid breaking the process
                        contour_analysis = {
                            'contourPattern': 'Error',
                            'contourValues': [],
                            'contourMetrics': {'max': 0, 'min': 0, 'range': 0, 'mean': 0, 'median': 0, 'stdDev': 0}
                        }
                    
                    row = [
                        sidx,
                        sent_data['sent'],
                        contour_analysis['contourPattern'],
                        sent_data['contour'],  # Original contour values
                        contour_analysis['contourMetrics']['max'],
                        contour_analysis['contourMetrics']['min'],
                        contour_analysis['contourMetrics']['range'],
                        contour_analysis['contourMetrics']['mean'],
                        contour_analysis['contourMetrics']['median'],
                        contour_analysis['contourMetrics']['stdDev']
                    ]
                    
                    writer.writerow([encode_item_py2(item) for item in row])
            
            valid_sentences = sum(1 for sent_data in sentence_map.values() 
                                if isinstance(sent_data, dict) and 'sent' in sent_data and 'contour' in sent_data)
            
            logging.info("Successfully wrote sentences CSV with %d sentences", valid_sentences)
        
    except IOError as e:
        logging.error("IOError writing sentences CSV: %s", e)
        raise
    except csv.Error as e:
        logging.error("CSV Error writing sentences CSV: %s", e)
        raise
    except Exception as e:
        logging.error("Unexpected error writing sentences CSV: %s", e)
        logging.error(traceback.format_exc())
        raise

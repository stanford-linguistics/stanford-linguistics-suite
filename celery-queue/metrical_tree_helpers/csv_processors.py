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
    lowercase_word_counts = collections.Counter()
    sentence_map = collections.defaultdict(dict)
    header = []
    
    # Define required columns - using exact names from metricaltree.py output
    required_columns = ['sidx', 'widx', 'word', 'contour', 'sent']
    
    # Initialize column indices with -1 (not found)
    column_indices = {col: -1 for col in required_columns}
    
    # Flag to detect if we're dealing with a CSV that has empty rows
    has_empty_row_pattern = False
    
    try:
        # Handle Unicode in CSV reading for Python 2.7
        # Use a more memory-efficient approach that avoids loading the entire file
        import StringIO
        import codecs
        
        # Open the file in binary mode to avoid encoding issues
        with open(raw_csv_path, 'rb') as infile:
            # Create a UTF-8 decoder that processes one line at a time with proper quoting handling
            import csv
            reader = csv.reader(
                codecs.getreader('utf-8')(infile), 
                quoting=csv.QUOTE_ALL, 
                doublequote=True,  # Handle double-quotes inside quoted fields
                quotechar='"',
                skipinitialspace=True  # Skip whitespace after delimiter
            )
            try:
                header = next(reader)
                logging.info("Successfully read header from %s", raw_csv_path)

                # Find required column indices first - using exact column names
                for col_name in required_columns:
                    if col_name in header:
                        column_indices[col_name] = header.index(col_name)
                        logging.info("Found column '%s' at index %d", col_name, column_indices[col_name])
                    else:
                        logging.error("Missing required column '%s' in %s", col_name, raw_csv_path)
                        # Log the available columns to help diagnose the issue
                        logging.error("Available columns: %s", header)
                        raise ValueError("Missing required column: " + col_name)

                # Read and log the first 3 rows right after header for debugging
                first_rows = []
                for i in range(3):
                    try:
                        row = next(reader)
                        first_rows.append(row)
                        
                        # Get widx and word from the row using the correct indices
                        widx_val = "N/A"
                        word_val = "N/A"
                        if len(row) > column_indices['widx']:
                            widx_val = row[column_indices['widx']]
                        if len(row) > column_indices['word']:
                            word_val = row[column_indices['word']]
                            
                        logging.info("RAW ROW AFTER HEADER #%d: widx=%s, word=%s, full_row=%r", 
                                    i+1, widx_val, word_val, row)
                    except StopIteration:
                        logging.info("Only found %d rows after header", i)
                        break
                
                # Reset the file pointer to start reading from the beginning again
                infile.seek(0)
                
                # Create a fresh reader rather than reusing the existing one
                # This ensures we don't skip the first data row
                reader = csv.reader(
                    codecs.getreader('utf-8')(infile), 
                    quoting=csv.QUOTE_ALL, 
                    doublequote=True,
                    quotechar='"',
                    skipinitialspace=True
                )
                
                # Skip header again to get back to the first data row
                next(reader)
                
                logging.info("File pointer reset with fresh reader after examining first %d rows", len(first_rows))
                
            except StopIteration:
                logging.error("CSV file is empty: %s", raw_csv_path)
                raise IOError("CSV file is empty")

            # Find required column indices - using exact column names
            for col_name in required_columns:
                if col_name in header:
                    column_indices[col_name] = header.index(col_name)
                    logging.info("Found column '%s' at index %d", col_name, column_indices[col_name])
                else:
                    logging.error("Missing required column '%s' in %s", col_name, raw_csv_path)
                    # Log the available columns to help diagnose the issue
                    logging.error("Available columns: %s", header)
                    raise ValueError("Missing required column: " + col_name)
            
            # Process rows to build indexes
            row_count = 0
            sentence_first_words = {}  # Track first word index for each sentence
            
            # Check for empty row pattern in the first few rows
            sample_rows = []
            for i, row in enumerate(reader):
                if i < 5:  # Sample the first 5 rows
                    sample_rows.append(row)
                else:
                    break
                    
            # Reset the file pointer to start reading from the beginning again
            infile.seek(0)
            
            # Create a fresh reader rather than reusing the existing one
            reader = csv.reader(
                codecs.getreader('utf-8')(infile), 
                quoting=csv.QUOTE_ALL, 
                doublequote=True,
                quotechar='"',
                skipinitialspace=True
            )
            
            # Skip header again
            next(reader)
            
            # Log sample rows for debugging
            for i, row in enumerate(sample_rows):
                logging.info("Sample row %d: %r (length: %d)", i+1, row, len(row))
                
            # Based on the sample rows, determine if we have a pattern of empty rows
            has_empty_row_pattern = False
            if len(sample_rows) >= 2:
                # Check if every other row is empty
                empty_rows = [i for i, row in enumerate(sample_rows) if len(row) == 0]
                if empty_rows:
                    # Check if there's a pattern (every other row, every third row, etc.)
                    if all(i % 2 == empty_rows[0] % 2 for i in empty_rows):
                        has_empty_row_pattern = True
                        logging.info("Detected pattern of empty rows (every other row). Will skip empty rows.")
                    # Also check for Windows-style line endings causing empty rows
                    elif len(empty_rows) == len(sample_rows) // 2:
                        has_empty_row_pattern = True
                        logging.info("Detected possible Windows line ending issue causing empty rows. Will skip empty rows.")
                    
            # If the CSV has specific formatting issues, try to detect them
            csv_has_quote_issues = False
            for row in sample_rows:
                if row and any('"' in field for field in row):
                    csv_has_quote_issues = True
                    logging.info("Detected potential quoting issues in CSV. Using more lenient parsing.")
            
            for row in reader:
                row_count += 1
                
                # Skip empty rows if we detected a pattern
                if has_empty_row_pattern and len(row) == 0:
                    logging.debug("Skipping empty row %d as part of detected pattern", row_count)
                    continue
                
                # We know exactly what to expect in our CSV and there should be no additional header rows
                
                # Check if row has enough columns before processing
                if len(row) <= max(column_indices.values()):
                    logging.warning("Skipping row %d due to insufficient columns. Expected at least %d columns, got %d.", 
                                   row_count + 1, max(column_indices.values()) + 1, len(row))
                    logging.warning("Row content: %r", row)
                    continue
                
                try:
                    # Always ensure word is Unicode
                    try:
                        word_raw = row[column_indices['word']]
                    except IndexError:
                        logging.warning("Row %d: Missing 'word' column at index %d. Row has %d columns: %r", 
                                      row_count + 1, column_indices['word'], len(row), row)
                        continue
                        
                    if isinstance(word_raw, bytes):
                        try:
                            word = word_raw.decode('utf-8')
                        except UnicodeDecodeError:
                            logging.warning("Skipping row %d due to UTF-8 decode error for word.", row_count + 1)
                            continue
                    else:
                        word = word_raw

                    # Get and validate sidx and widx
                    try:
                        sidx_raw = row[column_indices['sidx']]
                        widx_raw = row[column_indices['widx']]
                        
                        # Log the raw values for debugging
                        logging.debug("Row %d: Raw sidx='%s', widx='%s'", row_count + 1, sidx_raw, widx_raw)
                        
                        sidx = int(sidx_raw)
                        widx = int(widx_raw)
                    except ValueError as e:
                        logging.warning("Row %d: Invalid sidx/widx format - %s. Values: sidx='%s', widx='%s'", 
                                      row_count + 1, str(e), 
                                      row[column_indices['sidx']] if column_indices['sidx'] < len(row) else "MISSING", 
                                      row[column_indices['widx']] if column_indices['widx'] < len(row) else "MISSING")
                        continue
                    except IndexError as e:
                        logging.warning("Row %d: Missing sidx/widx column - %s. Indices: sidx=%d, widx=%d, row length=%d", 
                                      row_count + 1, str(e), column_indices['sidx'], column_indices['widx'], len(row))
                        continue
                    word_counts[word] += 1
                    
                    # Handle lowercasing safely
                    try:
                        if word:
                            # First ensure we have a unicode object
                            if isinstance(word, str):  # In Python 2, str means bytes
                                try:
                                    unicode_word = word.decode('utf-8', 'replace')
                                except (UnicodeError, AttributeError):
                                    logging.warning("Failed to decode word '%r' to Unicode in row %d", word, row_count + 1)
                                    unicode_word = word.decode('ascii', 'replace')
                            else:
                                unicode_word = word
                            
                            # Now lowercase the unicode object
                            word_lower = unicode_word.lower()
                            
                            # Store as is - no need to encode back for internal use
                            lowercase_word_counts[word_lower] += 1
                    except Exception as e:
                        logging.warning("Error lowercasing word '%r': %s", word, e)
                        lowercase_word_counts[word] += 1  # Fallback: use original word
                    sentence_map[sidx][widx] = word
                    
                    # Debug log for first few words to help diagnose indexing issues
                    if widx <= 3:
                        logging.info("Mapping sentence %d, word %d: '%s'", sidx, widx, word)

                    # Log when we're processing row with widx=1
                    if widx == 1:
                        logging.info("PROCESSING WIDX=1: sentence %d, word='%s', row_count=%d", sidx, word, row_count)
                        # Check if this word is already in sentence_map
                        if 1 in sentence_map[sidx]:
                            logging.warning("DUPLICATE WIDX=1: sentence %d already has word '%s' for widx=1, current word is '%s'", 
                                          sidx, sentence_map[sidx][1], word)
                    
                    # Store sentence and contour data for the first word of each sentence
                    # Track the first word we see for each sentence (lowest widx)
                    if sidx not in sentence_first_words or widx < sentence_first_words[sidx]:
                        old_first = sentence_first_words.get(sidx, None)
                        sentence_first_words[sidx] = widx
                        logging.info("Setting first word for sentence %d: widx=%d (was %s), word='%s'", 
                                     sidx, widx, old_first if old_first is not None else "None", word)
                        
                        sentence_map[sidx]['sent'] = row[column_indices['sent']]
                        
                        # Handle contour data - it's a space-separated string of values
                        contour_data = row[column_indices['contour']]
                        # Store the raw contour data as is - we'll parse it during analysis
                        sentence_map[sidx]['contour'] = contour_data
                        logging.debug("Stored contour data for sentence %d: %s", sidx, contour_data[:50] + "..." if len(contour_data) > 50 else contour_data)

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
        
    return word_counts, lowercase_word_counts, sentence_map, header, column_indices

def process_and_write_results(raw_path, output_path, word_counts, lowercase_word_counts, sentence_map, header, column_indices):
    """
    Process raw CSV and write enhanced results CSV.
    """
    excluded_columns = ['sent', 'contour']
    
    # Debug sentence_map content
    logging.info("Debug: sentence_map contents:")
    for sidx, content in sentence_map.items():
        if isinstance(content, dict):
            word_entries = {k: v for k, v in content.items() if isinstance(k, (int, float)) or (isinstance(k, str) and k.isdigit())}
            logging.info("  Sentence {}: {} word entries".format(sidx, len(word_entries)))
            # Log the first few word entries to see what's there
            sorted_widx = sorted([int(w) if isinstance(w, str) else w for w in word_entries.keys() 
                                  if isinstance(w, (int, float)) or (isinstance(w, str) and w.isdigit())])
            logging.info("  Sentence {} widx values: {}".format(sidx, sorted_widx[:10] if len(sorted_widx) > 10 else sorted_widx))
            
            # Check if widx=1 is missing
            if 1 not in sorted_widx and '1' not in word_entries:
                logging.warning("  Missing widx=1 for sentence {}!".format(sidx))
                
            # Log the first word for this sentence
            if sorted_widx:
                first_widx = sorted_widx[0]
                logging.info("  First word for sentence {}: widx={}, word='{}'".format(sidx, first_widx, word_entries.get(first_widx) or word_entries.get(str(first_widx))))
    
    # Get filtered header (excluding sent and contour)
    filtered_header = [col for col in header if col not in excluded_columns]
    
    # Add enhancement columns
    enhanced_header = filtered_header + ['word_lower', 'word_freq', 'prev_word', 'prev_word_freq']
    
    try:
        import codecs
        
        # Open the input file in binary mode and use a UTF-8 decoder
        # Open the output file in binary mode for writing
        with open(raw_path, 'rb') as infile, io.open(output_path, 'wb') as outfile:
            # Create a CSV reader that processes one line at a time with consistent quoting settings
            reader = csv.reader(
                codecs.getreader('utf-8')(infile),
                quoting=csv.QUOTE_ALL, 
                doublequote=True,
                quotechar='"',
                skipinitialspace=True
            )
            # Use consistent quoting settings for the writer as well
            writer = csv.writer(
                outfile,
                quoting=csv.QUOTE_ALL,
                doublequote=True,
                quotechar='"'
            )
            
            # Skip header in input file
            next(reader)
            
            # Log the first 3 rows after header for debugging
            first_rows = []
            for i in range(3):
                try:
                    row = next(reader)
                    first_rows.append(row)
                    
                    # Get widx and word from the row using the correct indices
                    widx_val = "N/A"
                    word_val = "N/A"
                    if len(row) > column_indices['widx']:
                        widx_val = row[column_indices['widx']]
                    if len(row) > column_indices['word']:
                        word_val = row[column_indices['word']]
                        
                    logging.info("PROCESS FUNC - RAW ROW AFTER HEADER #%d: widx=%s, word=%s, full_row=%r", 
                                i+1, widx_val, word_val, row)
                except StopIteration:
                    logging.info("PROCESS FUNC - Only found %d rows after header", i)
                    break
            
            # Reset the file pointer to start reading from the beginning again
            infile.seek(0)
            
            # Create a fresh reader rather than reusing the existing one
            reader = csv.reader(
                codecs.getreader('utf-8')(infile), 
                quoting=csv.QUOTE_ALL, 
                doublequote=True,
                quotechar='"',
                skipinitialspace=True
            )
            
            # Skip header again
            next(reader)
            
            logging.info("PROCESS FUNC - File pointer reset with fresh reader after examining first %d rows", len(first_rows))
            
            # Write enhanced header
            writer.writerow([encode_item_py2(h) for h in enhanced_header])
            
            # Check if the CSV file has empty lines or other formatting issues
            # Read the first few lines to inspect
            sample_rows = []
            for i, row in enumerate(reader):
                if i < 5:  # Sample the first 5 rows
                    sample_rows.append(row)
                else:
                    break
                    
            # Reset the file pointer to start reading from the beginning again
            infile.seek(0)
            
            # Create a fresh reader rather than reusing the existing one
            reader = csv.reader(
                codecs.getreader('utf-8')(infile), 
                quoting=csv.QUOTE_ALL, 
                doublequote=True,
                quotechar='"',
                skipinitialspace=True
            )
            
            # Skip header again
            next(reader)
            
            # Log sample rows for debugging
            for i, row in enumerate(sample_rows):
                logging.info("Sample row %d: %r (length: %d)", i+1, row, len(row))
            
            # Process rows
            row_count = 0
            processed_rows = 0
            skipped_rows = 0
            
            # Based on the sample rows, determine if we have a pattern of empty rows
            has_empty_row_pattern = False
            if len(sample_rows) >= 2:
                # Check if every other row is empty
                empty_rows = [i for i, row in enumerate(sample_rows) if len(row) == 0]
                if empty_rows:
                    # Check if there's a pattern (every other row, every third row, etc.)
                    if all(i % 2 == empty_rows[0] % 2 for i in empty_rows):
                        has_empty_row_pattern = True
                        logging.info("Detected pattern of empty rows (every other row). Will skip empty rows.")
                    # Also check for Windows-style line endings causing empty rows
                    elif len(empty_rows) == len(sample_rows) // 2:
                        has_empty_row_pattern = True
                        logging.info("Detected possible Windows line ending issue causing empty rows. Will skip empty rows.")
            
            for row in reader:
                row_count += 1
                
                # Skip empty rows if we detected a pattern
                if has_empty_row_pattern and len(row) == 0:
                    logging.debug("Skipping empty row %d as part of detected pattern", row_count)
                    continue
                
                # We know exactly what to expect in our CSV and there should be no additional header rows
                
                # Check if row has enough columns before processing
                if len(row) <= max(column_indices.values()):
                    logging.warning("Skipping row %d in process_and_write_results due to insufficient columns. Expected at least %d columns, got %d.", 
                                   row_count + 1, max(column_indices.values()) + 1, len(row))
                    skipped_rows += 1
                    continue
                
                try:
                    # Get word and its frequency
                    try:
                        word = row[column_indices['word']]
                    except IndexError:
                        logging.warning("Row %d: Missing 'word' column at index %d in process_and_write_results. Row has %d columns.", 
                                      row_count + 1, column_indices['word'], len(row))
                        skipped_rows += 1
                        continue
                        
                    if isinstance(word, bytes):
                        word = word.decode('utf-8', 'replace')
                    
                    # Handle word lowercasing safely using the same approach as in build_data_indexes
                    try:
                        if word:
                            # First ensure we have a unicode object
                            if isinstance(word, str):  # In Python 2, str means bytes
                                try:
                                    unicode_word = word.decode('utf-8', 'replace')
                                except (UnicodeError, AttributeError):
                                    logging.warning("Failed to decode word '%r' to Unicode in row %d", word, row_count + 1)
                                    unicode_word = word.decode('ascii', 'replace')
                            else:
                                unicode_word = word
                            
                            # Now lowercase the unicode object
                            word_lower = unicode_word.lower()
                            
                            # For compatibility with the rest of the code, encode back to UTF-8
                            if not isinstance(word_lower, str):  # If it's unicode, encode to UTF-8
                                word_lower = word_lower.encode('utf-8', 'replace')
                        else:
                            word_lower = ''
                    except Exception as e:
                        logging.warning("Error lowercasing word '%r': %s", word, e)
                        word_lower = word  # Fallback to original
                    
                    # Get frequency using lowercase - handle unicode/str conversion consistently
                    word_freq = lowercase_word_counts.get(word_lower, 0)
                    
                    # Get previous word and its frequency
                    sidx = int(row[column_indices['sidx']])
                    widx = int(row[column_indices['widx']])
                    
                    # Check if this is the first word (widx=1) by looking for widx=1 in the sentence_map
                    # If we find it, its content is valid and should be used for the previous word of widx=2
                    if widx == 1:
                        prev_word = ''  # First word has no previous word
                    else:
                        prev_word = sentence_map.get(sidx, {}).get(widx - 1, '')
                    
                    # Handle previous word lowercasing with improved Unicode handling
                    try:
                        if prev_word:
                            # First ensure we have a unicode object
                            if isinstance(prev_word, str):  # In Python 2, str means bytes
                                try:
                                    unicode_prev = prev_word.decode('utf-8', 'replace')
                                except (UnicodeError, AttributeError):
                                    logging.warning("Failed to decode previous word '%r' to Unicode", prev_word)
                                    unicode_prev = prev_word.decode('ascii', 'replace')
                            else:
                                unicode_prev = prev_word
                            
                            # Now lowercase the unicode object
                            prev_word_lower = unicode_prev.lower()
                            
                            # For compatibility with the rest of the code, encode back to UTF-8
                            if not isinstance(prev_word_lower, str):  # If it's unicode, encode to UTF-8
                                prev_word_lower = prev_word_lower.encode('utf-8', 'replace')
                        else:
                            prev_word_lower = ''
                    except Exception as e:
                        logging.warning("Error lowercasing previous word '%r': %s", prev_word, e)
                        prev_word_lower = prev_word  # Fallback to original
                    
                    prev_word_freq = lowercase_word_counts.get(prev_word_lower, 0) if prev_word_lower else 0
                    
                    # Create filtered row (excluding sent and contour)
                    filtered_row = [row[i] for i, col in enumerate(header) if col not in excluded_columns]
                    
                    # Add enhancements
                    enhanced_row = filtered_row + [
                        word_lower,
                        word_freq,
                        prev_word if prev_word is not None else '',
                        prev_word_freq
                    ]
                    
                    writer.writerow([encode_item_py2(item) for item in enhanced_row])
                    processed_rows += 1
                    
                except (IndexError, ValueError) as e:
                    logging.warning("Error processing row %d: %s", row_count, e)
                    skipped_rows += 1
                    continue
                except Exception as e:
                    logging.error("Unexpected error processing row %d: %s", row_count, e)
                    logging.error(traceback.format_exc())
                    skipped_rows += 1
                    continue
                    
        logging.info("CSV Processing Summary:")
        logging.info("  - Total rows processed: %d", row_count)
        logging.info("  - Successfully enhanced rows: %d", processed_rows)
        logging.info("  - Skipped rows due to errors: %d", skipped_rows)
        logging.info("Successfully wrote enhanced results CSV with %d rows", processed_rows)
        
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
            # Use consistent quoting settings for the writer here too
            writer = csv.writer(
                outfile,
                quoting=csv.QUOTE_ALL,
                doublequote=True,
                quotechar='"'
            )
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

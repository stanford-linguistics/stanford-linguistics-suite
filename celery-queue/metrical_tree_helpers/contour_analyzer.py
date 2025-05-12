from __future__ import division
import json
import math
import io
import logging
import collections
import traceback

def analyze_contour_pattern_py(stress_str):
    """
    Analyzes the stress contour pattern from a string representation of a list.
    Python 2.7 equivalent of the JavaScript analyzeContourPattern.
    Handles potential JSON parsing errors and invalid data types.
    Also handles space-separated number strings that aren't valid JSON.
    """
    default_result = {
        'contourPattern': 'N/A',
        'contourValues': [],
        'contourMetrics': {'max': None, 'min': None, 'range': None, 'mean': None, 'median': None, 'stdDev': None}
    }
    try:
        if not isinstance(stress_str, basestring):  # noqa: F821
             stress_str = str(stress_str)

        try:
            # First try to parse as JSON
            logging.debug("Attempting to parse contour data as JSON: %s", 
                         stress_str[:50] + "..." if len(stress_str) > 50 else stress_str)
            values = json.loads(stress_str)
            logging.debug("Successfully parsed contour data as JSON")
        except ValueError as json_error:
            # If JSON parsing fails, try space-separated format
            logging.debug("JSON parsing failed, trying space-separated format")
            try:
                values = []
                for val in stress_str.split():
                    if val.lower() == 'nan':
                        continue
                    try:
                        values.append(float(val))
                    except ValueError:
                        # Skip values that can't be converted to float
                        logging.debug("Skipping non-float value: %s", val)
                        continue
                
                if not values:
                    logging.warning("No valid float values found in space-separated string: %s", 
                                   stress_str[:50] + "..." if len(stress_str) > 50 else stress_str)
                    raise json_error
                
                logging.debug("Successfully parsed %d values from space-separated format", len(values))
                
            except Exception as e:
                logging.warning("Failed to parse as space-separated numbers: %s", e)
                logging.warning("Original contour data: %s", 
                               stress_str[:50] + "..." if len(stress_str) > 50 else stress_str)
                raise json_error

        # Handle case where a single numeric value was parsed instead of a list
        if isinstance(values, (int, float)):
            # Convert single numeric value to a list with one element
            values = [values]
            logging.debug("Converted single numeric value to list: %s", values)
        elif not isinstance(values, list):
            logging.warning("Parsed stress data is not a list or numeric value: %s", stress_str)
            return default_result
        if not all(isinstance(x, (int, float)) for x in values):
             # Filter out non-numeric values if mixed types are possible, or return default
             numeric_values = [x for x in values if isinstance(x, (int, float))]
             if not numeric_values: # If no numeric values found
                 logging.warning("No numeric values found in stress list: %s", stress_str)
                 return default_result
             # Decide if proceeding with filtered values is acceptable
             logging.warning("Non-numeric values found in stress list, using only numeric ones: %s", stress_str)
             values = numeric_values # Use only the numeric values

        if not values:
            # Return default for empty list, but log differently than parse failure
            logging.debug("Empty stress list encountered: %s", stress_str)
            # Keep default pattern 'N/A' or change to 'Empty'? Let's stick to N/A for consistency.
            return default_result

    except (ValueError, TypeError) as e:
        logging.warning("Could not parse stress values JSON: %s. Error: %s", stress_str, e)
        return default_result
    except Exception as e: # Catch other unexpected errors during parsing
        logging.error("Unexpected error parsing stress values: %s. Error: %s", stress_str, e)
        logging.error(traceback.format_exc())
        return default_result

    n = len(values)
    metrics = {}

    try:
        # Calculate Metrics
        metrics['max'] = max(values)
        metrics['min'] = min(values)
        metrics['range'] = metrics['max'] - metrics['min']
        metrics['mean'] = sum(values) / float(n) # Use float division

        # Median
        sorted_values = sorted(values)
        if n % 2 == 1:
            metrics['median'] = sorted_values[n // 2]
        else: # n > 0 is guaranteed here based on earlier check
            mid1 = sorted_values[n // 2 - 1]
            mid2 = sorted_values[n // 2]
            metrics['median'] = (mid1 + mid2) / 2.0

        # Standard Deviation
        if n > 1:
            mean = metrics['mean']
            # Use float division for variance calculation
            variance = sum([(x - mean) ** 2 for x in values]) / float(n - 1)
            metrics['stdDev'] = math.sqrt(variance)
        else: # n == 1
             metrics['stdDev'] = 0.0 # Std dev of single point is 0

    except Exception as e:
        logging.error("Error calculating metrics for stress values %s: %s", values, e)
        logging.error(traceback.format_exc())
        # Return default metrics if calculation fails
        metrics = default_result['contourMetrics']

    # Determine Pattern
    pattern = 'N/A'
    # n > 0 is guaranteed here
    if n == 1:
        pattern = 'Single'
    elif all(v == values[0] for v in values):
        pattern = 'Level'
    else:
        # Check strictly rising/falling first
        is_strictly_rising = all(values[i] < values[i+1] for i in range(n-1))
        is_strictly_falling = all(values[i] > values[i+1] for i in range(n-1))
        # Check non-decreasing / non-increasing
        is_non_decreasing = all(values[i] <= values[i+1] for i in range(n-1))
        is_non_increasing = all(values[i] >= values[i+1] for i in range(n-1))

        if is_strictly_rising:
            pattern = 'Rising'
        elif is_strictly_falling:
            pattern = 'Falling'
        elif is_non_decreasing: # Non-decreasing but not strictly rising
             pattern = 'Non-decreasing'
        elif is_non_increasing: # Non-increasing but not strictly falling
             pattern = 'Non-increasing'
        else:
            # More complex patterns: Peak, Valley, Complex
            max_val = metrics.get('max')
            min_val = metrics.get('min')

            if max_val is None or min_val is None: # Check if metrics calculation failed
                 pattern = 'Complex' # Cannot determine peak/valley without max/min
            else:
                # Peak: rises then falls (max not *only* at ends)
                # Find indices of max value
                max_indices = {i for i, x in enumerate(values) if x == max_val}
                # Check if there's a max value strictly between the ends
                has_internal_max = any(0 < i < n - 1 for i in max_indices)

                # Valley: falls then rises (min not *only* at ends)
                min_indices = {i for i, x in enumerate(values) if x == min_val}
                has_internal_min = any(0 < i < n - 1 for i in min_indices)

                # Refined Peak/Valley logic (similar to JS version)
                # A peak exists if there's an internal max AND the max isn't *only* at the start or *only* at the end.
                is_peak = has_internal_max and not (max_indices == {0} or max_indices == {n-1})
                # A valley exists if there's an internal min AND the min isn't *only* at the start or *only* at the end.
                is_valley = has_internal_min and not (min_indices == {0} or min_indices == {n-1})

                # Prioritize Peak if both conditions might seem true in complex cases
                if is_peak:
                    pattern = 'Peak'
                elif is_valley: # Only classify as Valley if not already a Peak
                    pattern = 'Valley'
                else:
                    # Covers cases where max/min are only at ends but sequence isn't monotonic,
                    # or other complex shapes.
                    pattern = 'Complex'

    return {
        'contourPattern': pattern,
        'contourValues': values,
        'contourMetrics': metrics
    }

def calculate_pattern_metrics(pattern_data):
    """
    Calculate average metrics for a pattern group.
    Python 2 compatible implementation.
    Handles None values in metrics by filtering them out.
    """
    metrics = pattern_data['metrics']
    count = len(metrics)
    if count == 0:
        return {
            'range': 0.0,
            'mean': 0.0,
            'stdDev': 0.0
        }
    
    # Filter out metrics with None values
    valid_metrics_range = [m['range'] for m in metrics if m['range'] is not None]
    valid_metrics_mean = [m['mean'] for m in metrics if m['mean'] is not None]
    valid_metrics_stddev = [m['stdDev'] for m in metrics if m['stdDev'] is not None]
    
    # Calculate averages only if we have valid metrics
    valid_count_range = len(valid_metrics_range)
    valid_count_mean = len(valid_metrics_mean)
    valid_count_stddev = len(valid_metrics_stddev)
    
    # Default values in case there are no valid metrics
    avg_range = 0.0
    avg_mean = 0.0
    avg_stddev = 0.0
    
    # Calculate averages only if we have valid metrics
    if valid_count_range > 0:
        avg_range = sum(valid_metrics_range) / float(valid_count_range)
    if valid_count_mean > 0:
        avg_mean = sum(valid_metrics_mean) / float(valid_count_mean)
    if valid_count_stddev > 0:
        avg_stddev = sum(valid_metrics_stddev) / float(valid_count_stddev)
    
    return {
        'range': avg_range,
        'mean': avg_mean,
        'stdDev': avg_stddev
    }

def calculate_pattern_distribution(patterns_data):
    """
    Calculate percentage distribution of patterns.
    Python 2 compatible implementation.
    """
    total = sum(data['count'] for data in patterns_data.values())
    if total == 0:
        return {}
    
    return {
        pattern: '{:.1%}'.format(data['count'] / float(total))
        for pattern, data in patterns_data.items()
    }

def calculate_pattern_transitions(pattern_sequence):
    """
    Calculate pattern transitions.
    Python 2 compatible implementation.
    """
    transitions = collections.Counter()
    for i in range(len(pattern_sequence) - 1):
        transition = '{}->>{}'.format(pattern_sequence[i], pattern_sequence[i + 1])
        transitions[transition] += 1
    return dict(transitions)

def generate_analysis_summary(output_path, word_counts, sentence_map=None, lowercase_word_counts=None):
    """
    Generate and write enhanced analysis summary JSON.
    Python 2 compatible implementation.
    """
    analysis_summary = {
        'wordFrequencies': {},
        'contourPatterns': {
            'patterns': {},
            'distribution': {},
            'transitions': {},
            'mostCommon': None,
            'leastCommon': None
        }
    }

    # Use lowercase word counts for frequency analysis if available
    if lowercase_word_counts:
        analysis_summary['wordFrequencies'] = dict(lowercase_word_counts)
    else:
        analysis_summary['wordFrequencies'] = dict(word_counts)

    # Process contour patterns if sentence_map is provided
    if sentence_map:
        patterns_data = {}
        pattern_sequence = []
        
        # First pass: collect pattern data
        for sidx in sorted(sentence_map.keys()):
            sent_data = sentence_map[sidx]
            if isinstance(sent_data, dict) and 'contour' in sent_data:
                contour_analysis = analyze_contour_pattern_py(sent_data['contour'])
                pattern = contour_analysis['contourPattern']
                
                # Initialize pattern data if needed
                if pattern not in patterns_data:
                    patterns_data[pattern] = {
                        'count': 0,
                        'sentences': [],
                        'metrics': []
                    }
                
                # Update pattern data
                patterns_data[pattern]['count'] += 1
                patterns_data[pattern]['sentences'].append(sidx)
                patterns_data[pattern]['metrics'].append(contour_analysis['contourMetrics'])
                pattern_sequence.append(pattern)
        
        # Calculate pattern statistics
        for pattern, data in patterns_data.items():
            analysis_summary['contourPatterns']['patterns'][pattern] = {
                'count': data['count'],
                'sentences': data['sentences'],
                'averageMetrics': calculate_pattern_metrics(data)
            }
        
        # Calculate distribution
        analysis_summary['contourPatterns']['distribution'] = \
            calculate_pattern_distribution(patterns_data)
        
        # Calculate transitions
        analysis_summary['contourPatterns']['transitions'] = \
            calculate_pattern_transitions(pattern_sequence)
        
        # Find most/least common patterns
        if patterns_data:
            by_count = sorted(patterns_data.items(), 
                            key=lambda x: (x[1]['count'], x[0]), 
                            reverse=True)
            analysis_summary['contourPatterns']['mostCommon'] = by_count[0][0]
            analysis_summary['contourPatterns']['leastCommon'] = by_count[-1][0]

    try:
        analysis_json = json.dumps(analysis_summary, indent=4, ensure_ascii=False, sort_keys=True)
        with io.open(output_path, 'w', encoding='utf-8') as outfile:
            outfile.write(unicode(analysis_json))  # noqa: F821
        logging.info("Successfully wrote analysis summary JSON to %s", output_path)

    except IOError as e:
        logging.error("IOError writing analysis summary JSON file %s: %s", output_path, e)
        raise
    except TypeError as e:
        logging.error("TypeError writing analysis summary JSON file %s: %s", output_path, e)
        logging.error("Summary data sample: %s", repr(analysis_summary)[:500])  # Log sample data
        raise
    except Exception as e:
        logging.error("Unexpected error writing analysis summary JSON file %s: %s", output_path, e)
        logging.error(traceback.format_exc())
        raise

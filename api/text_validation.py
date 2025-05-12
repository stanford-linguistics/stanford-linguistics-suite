"""
Text Validation Utilities for Flask API

These utilities help validate and normalize text content before sending it to the Celery workers.
This provides early validation in Python 3 with better Unicode support than the Python 2 workers.
"""
import logging
import os
from typing import Dict, List, Tuple, Optional

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def normalize_text(text: str, placeholder: str = '?', warn_threshold: float = 0.05) -> Tuple[str, List[Dict], Optional[Dict]]:
    """
    Replace accented characters with their ASCII equivalents and other non-ASCII
    characters with placeholders. This helps prevent Unicode encoding issues in
    the processing pipeline while preserving text structure.
    
    Args:
        text: The text to normalize
        placeholder: Character to use for non-ASCII characters without equivalents (default: '?')
        warn_threshold: Threshold for warning about high non-ASCII content (default: 0.05 or 5%)
        
    Returns:
        Tuple of (normalized_text, warnings, error) where:
        - normalized_text is the text with accented characters replaced
        - warnings is a list of warning dictionaries
        - error is None or an error dictionary if the text has too many non-ASCII characters
    """
    logger.info(f"NORMALIZE TEXT: Starting normalization of text (length: {len(text) if text else 0} chars)")
    
    if not text:
        logger.info("NORMALIZE TEXT: Empty text provided, returning as is")
        return text, [], None
    
    # Common accented characters and their ASCII equivalents
    replacements = {
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ý': 'y', 'ÿ': 'y',
        'ñ': 'n',
        'ç': 'c',
        'ß': 'ss',
        # Uppercase versions
        'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A',
        'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
        'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
        'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
        'Ý': 'Y',
        'Ñ': 'N',
        'Ç': 'C',
        # Smart quotes and typographic characters
        '"': '"',  # Left double quote (U+201C)
        '"': '"',  # Right double quote (U+201D)
        ''': "'",  # Right single quote/apostrophe (U+2019)
        ''': "'",  # Left single quote (U+2018)
        '—': "-",  # Em dash (U+2014)
        '–': "-",  # En dash (U+2013)
        '…': "...", # Ellipsis (U+2026)
    }
    
    # Create a mapping specifically for typographic characters
    typographic_chars = {
        '\u201c': '"',  # Left double quote
        '\u201d': '"',  # Right double quote
        '\u2018': "'",  # Left single quote
        '\u2019': "'",  # Right single quote (apostrophe)
        '\u2014': "-",  # Em dash
        '\u2013': "-",  # En dash
        '\u2026': "...", # Ellipsis
    }
    
    # Count original length for warning threshold calculation
    original_length = len(text)
    
    # Track non-ASCII characters that were replaced
    replaced_count = 0
    
    # Process text character by character with special handling for typographic chars
    result = []
    non_ascii_chars = {}
    
    for c in text:
        # First check if it's a common typographic character
        if c in typographic_chars:
            result.append(typographic_chars[c])
            # We don't count these as replacements since they have direct ASCII equivalents
        # Then check if it's in our accented character replacements
        elif c in replacements:
            result.append(replacements[c])
            # We don't count these as replacements since they have direct ASCII equivalents
        # Then check if it's ASCII
        elif ord(c) < 128:
            result.append(c)
        # Otherwise replace with placeholder
        else:
            result.append(placeholder)
            replaced_count += 1
            # Track which non-ASCII characters were found and how many times
            if c in non_ascii_chars:
                non_ascii_chars[c] += 1
            else:
                non_ascii_chars[c] = 1
            
            # Add debug logging for unhandled characters
            logger.debug(f"Unhandled non-ASCII character: '{c}' (U+{ord(c):04X})")
    
    normalized_text = ''.join(result)
    
    # Log details about non-ASCII characters found
    if non_ascii_chars:
        logger.info(f"NORMALIZE TEXT: Found {len(non_ascii_chars)} unique non-ASCII characters:")
        for char, count in sorted(non_ascii_chars.items(), key=lambda x: x[1], reverse=True)[:10]:
            logger.info(f"  - '{char}' (U+{ord(char):04X}): {count} occurrences")
        if len(non_ascii_chars) > 10:
            logger.info(f"  - ... and {len(non_ascii_chars) - 10} more unique characters")
    
    # Generate warnings and errors based on replacement ratio
    warnings = []
    error = None
    
    if original_length > 0:
        replacement_ratio = float(replaced_count) / original_length
        
        # Always add metadata about replacements
        if replaced_count > 0:
            warnings.append({
                "type": "info",
                "message": f"{replaced_count} non-ASCII characters were replaced with '{placeholder}'",
                "replacement_ratio": round(replacement_ratio * 100, 2)
            })
        
        # Warning threshold (default 5%)
        if replacement_ratio > warn_threshold:
            warnings.append({
                "type": "warning",
                "message": f"{round(replacement_ratio * 100, 1)}% of characters were non-ASCII and replaced with '{placeholder}'",
                "suggestion": "This may affect linguistic analysis. Consider reviewing your input text."
            })
        
        # Error threshold (20% - this is configurable)
        error_threshold = 0.20  # 20%
        if replacement_ratio > error_threshold:
            error = {
                "error": "Excessive non-ASCII content",
                "message": f"{round(replacement_ratio * 100, 1)}% of characters were non-ASCII",
                "suggestion": "The input text contains too many characters that are not compatible with the metrical tree analysis. Please review your text and remove or replace non-ASCII characters.",
                "code": "invalid_text_content"
            }
    
    return normalized_text, warnings, error

def validate_text_file(file_path: str, max_non_ascii_ratio: float = 0.20) -> Tuple[bool, List[Dict], Optional[Dict]]:
    """
    Validate and normalize text content in a file, replacing accented characters
    and checking for excessive non-ASCII content.
    
    Args:
        file_path: Path to the text file to validate
        max_non_ascii_ratio: Maximum allowed ratio of non-ASCII characters (default: 0.20 or 20%)
        
    Returns:
        Tuple of (success, warnings, error) where:
        - success is True if the file was successfully validated and normalized
        - warnings is a list of warning dictionaries
        - error is None or an error dictionary if validation failed
    """
    logger.info(f"VALIDATION STARTED: Validating text file at path: {file_path}")
    
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            logger.error(f"VALIDATION ERROR: File does not exist: {file_path}")
            return False, [], {
                "error": "File not found",
                "message": f"The input file does not exist: {file_path}",
                "suggestion": "Please check the file path and ensure the file was uploaded correctly",
                "code": "file_not_found"
            }
            
        # Get file size for logging
        file_size = os.path.getsize(file_path)
        logger.info(f"VALIDATION INFO: File size: {file_size} bytes")
        
        # Read the file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        logger.info(f"VALIDATION INFO: Successfully read file with UTF-8 encoding, length: {len(content)} characters")
        
        # Log a preview of the content (first 100 chars)
        preview = content[:100] + ('...' if len(content) > 100 else '')
        logger.info(f"VALIDATION INFO: Content preview: {preview}")
        
        # Normalize the text
        logger.info(f"VALIDATION INFO: Starting text normalization with warn_threshold={max_non_ascii_ratio/4}")
        normalized_content, warnings, error = normalize_text(content, warn_threshold=max_non_ascii_ratio/4)
        
        # Log the results
        logger.info(f"VALIDATION INFO: Normalized content length: {len(normalized_content)} characters")
        logger.info(f"VALIDATION INFO: Warnings: {warnings}")
        logger.info(f"VALIDATION INFO: Error: {error}")
        
        # If there's an error, return it
        if error:
            return False, warnings, error
        
        # Write the normalized content back to the file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(normalized_content)
        
        return True, warnings, None
        
    except UnicodeDecodeError:
        # Try with a different encoding if UTF-8 fails
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
            
            # Normalize the text
            normalized_content, warnings, error = normalize_text(content, warn_threshold=max_non_ascii_ratio/4)
            
            # Add warning about encoding
            warnings.append({
                "type": "warning",
                "message": "File was not UTF-8 encoded, used Latin-1 encoding instead",
                "suggestion": "Consider saving your file with UTF-8 encoding for better compatibility"
            })
            
            # If there's an error, return it
            if error:
                return False, warnings, error
            
            # Write the normalized content back to the file with UTF-8 encoding
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(normalized_content)
            
            return True, warnings, None
            
        except Exception as e:
            logger.error(f"Failed to read file with Latin-1 encoding: {e}")
            return False, [], {
                "error": "Encoding error",
                "message": "Could not determine the file encoding",
                "suggestion": "Please ensure your file is saved with UTF-8 encoding",
                "code": "encoding_error"
            }
    
    except Exception as e:
        logger.error(f"Failed to validate text file: {e}")
        return False, [], {
            "error": "File validation error",
            "message": f"Failed to validate text file: {str(e)}",
            "suggestion": "Please check that the file is a valid text file",
            "code": "file_validation_error"
        }

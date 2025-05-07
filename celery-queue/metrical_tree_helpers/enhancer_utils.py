from __future__ import division
import os
import logging

def rename_and_backup_original(original_path, backup_path):
    """
    Rename original file to create a backup.
    """
    if os.path.exists(original_path):
        os.rename(original_path, backup_path)
        logging.info("Renamed original file to %s", backup_path)
    else:
        logging.error("Original file not found: %s", original_path)
        raise IOError("Original results file not found")

def cleanup_temp_files(raw_path):
    """
    Remove temporary files after processing.
    """
    if os.path.exists(raw_path):
        os.remove(raw_path)
        logging.info("Removed temporary file: %s", raw_path)

def encode_item_py2(item):
    if isinstance(item, unicode):  # noqa: F821
        return item.encode('utf-8')
    elif item is None:
        return ''  # Represent None as empty string in CSV
    elif isinstance(item, (int, float)):
        return str(item)  # Convert numbers to string
    # Check if it's already a byte string (str in Py2)
    elif isinstance(item, str):
        return item
    else:
        # Attempt to convert other types to string and then encode
        try:
            return unicode(item).encode('utf-8')  # noqa: F821
        except UnicodeError:
            # Fallback for complex types or encoding issues
            logging.warning("Could not encode item of type %s to UTF-8, using repr().", type(item))
            return repr(item).encode('utf-8', 'replace')

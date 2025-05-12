"""
Error handling module for task processing

This module defines exception classes and utilities for classifying,
categorizing, and providing meaningful error messages for the various
types of errors that can occur during task processing.
"""

import json
import traceback
from functools import wraps

class _EnumValue(str):
    """A string subclass that adds enum-like behavior"""
    pass


# Error severity constants
class ErrorSeverity(object):
    """Severity levels for errors"""
    WARNING = _EnumValue("warning")    # User can continue but may get suboptimal results
    ERROR = _EnumValue("error")        # Fatal error that prevents completion 
    CRITICAL = _EnumValue("critical")  # System-level error that needs urgent attention


# Error category constants
class ErrorCategory(object):
    """Categories of errors to help guide troubleshooting"""
    INPUT_VALIDATION = _EnumValue("input_validation")          # Input data format errors
    LINGUISTIC_PROCESSING = _EnumValue("linguistic_processing")  # Language processing errors
    COMPUTATIONAL = _EnumValue("computational")                 # Resource or computation errors
    SYSTEM = _EnumValue("system")                               # System or environment errors
    UNKNOWN = _EnumValue("unknown")                             # Uncategorized/unexpected errors


# Error code constants
class ErrorCode(object):
    """Specific error codes for detailed error classification"""
    # Input validation errors
    INVALID_FORMAT = _EnumValue("invalid_format")
    MISSING_REQUIRED_FIELD = _EnumValue("missing_required_field")
    INVALID_VALUE = _EnumValue("invalid_value")
    EMPTY_INPUT = _EnumValue("empty_input")
    MALFORMED_TEXT = _EnumValue("malformed_text")
    INPUT_TOO_LARGE = _EnumValue("input_too_large")
    ENCODING_ERROR = _EnumValue("encoding_error")
    
    # Linguistic processing errors
    PARSER_FAILURE = _EnumValue("parser_failure")
    TOKENIZATION_ERROR = _EnumValue("tokenization_error")
    DICTIONARY_LOOKUP_FAILURE = _EnumValue("dictionary_lookup_failure")
    SYLLABIFICATION_ERROR = _EnumValue("syllabification_error")
    AMBIGUOUS_WORD = _EnumValue("ambiguous_word")
    SYLLABUS_LOOKUP_FAILURE = _EnumValue("syllabus_lookup_failure")
    AMBIGUITY_RESOLUTION_FAILURE = _EnumValue("ambiguity_resolution_failure")
    
    # Computational errors
    TIMEOUT = _EnumValue("timeout")
    MEMORY_LIMIT_EXCEEDED = _EnumValue("memory_limit_exceeded")
    COMPUTATION_FAILED = _EnumValue("computation_failed")
    
    # System errors
    FILE_SYSTEM_ERROR = _EnumValue("file_system_error")
    FILE_NOT_FOUND = _EnumValue("file_not_found")
    PERMISSION_DENIED = _EnumValue("permission_denied")
    DEPENDENCY_MISSING = _EnumValue("dependency_missing")
    CONFIGURATION_ERROR = _EnumValue("configuration_error")
    DATABASE_ERROR = _EnumValue("database_error")
    
    # CLI errors
    CLI_EXECUTION_ERROR = _EnumValue("cli_execution_error")
    CLI_OUTPUT_PARSING_ERROR = _EnumValue("cli_output_parsing_error")
    CLI_TIMEOUT_ERROR = _EnumValue("cli_timeout_error")
    
    # Unknown errors
    UNEXPECTED_ERROR = _EnumValue("unexpected_error")


class TaskException(Exception):
    """Base exception class for task processing errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.UNEXPECTED_ERROR,
        category=ErrorCategory.UNKNOWN,
        severity=ErrorSeverity.ERROR,
        details=None,
        suggestion=None,
        **kwargs
    ):
        """
        Initialize the exception
        
        Args:
            message: Human-readable error message
            error_code: Specific error code for this error
            category: Error category for classification
            severity: Error severity level
            details: Additional details about the error (structured data)
            suggestion: Suggested action to resolve the error
        """
        super(TaskException, self).__init__(message)
        self.message = message
        self.error_code = error_code
        self.category = category
        self.severity = severity
        self.details = details or {}
        self.suggestion = suggestion
        
        # Add any additional keyword arguments to details
        for key, value in kwargs.items():
            if key not in ['message', 'error_code', 'category', 'severity', 'details', 'suggestion']:
                self.details[key] = value
        
        # If there's an exception in kwargs, capture its traceback
        if 'exception' in kwargs and isinstance(kwargs['exception'], Exception):
            self.details['exception_traceback'] = traceback.format_exc()
    
    def to_dict(self):
        """
        Convert the exception to a dictionary that can be serialized to JSON
        
        Returns:
            Dictionary representation of the exception
        """
        return {
            'message': self.message,
            'error_code': self.error_code,
            'category': self.category,
            'category_description': self._get_category_description(),
            'severity': self.severity,
            'suggestion': self.suggestion,
            'details': self.details
        }
    
    def _get_category_description(self):
        """Get a human-readable description of the error category"""
        descriptions = {
            ErrorCategory.INPUT_VALIDATION: "Input Validation Error",
            ErrorCategory.LINGUISTIC_PROCESSING: "Linguistic Processing Error",
            ErrorCategory.COMPUTATIONAL: "System Resource Error",
            ErrorCategory.SYSTEM: "System Error",
            ErrorCategory.UNKNOWN: "Unknown Error"
        }
        return descriptions.get(self.category, "Error")
    
    def to_json(self):
        """
        Convert the exception to a JSON string
        
        Returns:
            JSON string representation of the exception
        """
        return json.dumps(self.to_dict())


class InputValidationException(TaskException):
    """Exception for input validation errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.INVALID_FORMAT,
        details=None,
        suggestion=None,
        **kwargs
    ):
        super(InputValidationException, self).__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.INPUT_VALIDATION,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion,
            **kwargs
        )


class LinguisticProcessingException(TaskException):
    """Exception for linguistic processing errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.PARSER_FAILURE,
        details=None,
        suggestion=None,
        **kwargs
    ):
        super(LinguisticProcessingException, self).__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.LINGUISTIC_PROCESSING,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion,
            **kwargs
        )


class ComputationalException(TaskException):
    """Exception for computational resource errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.COMPUTATION_FAILED,
        details=None,
        suggestion=None,
        **kwargs
    ):
        super(ComputationalException, self).__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.COMPUTATIONAL,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion,
            **kwargs
        )


class SystemException(TaskException):
    """Exception for system-level errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.CONFIGURATION_ERROR,
        details=None,
        suggestion=None,
        **kwargs
    ):
        super(SystemException, self).__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.SYSTEM,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion,
            **kwargs
        )


class CLIProcessingException(TaskException):
    """Exception for CLI processing errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.CLI_EXECUTION_ERROR,
        details=None,
        suggestion=None,
        **kwargs
    ):
        super(CLIProcessingException, self).__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.SYSTEM,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion,
            **kwargs
        )


def capture_exception(func):
    """
    Decorator to capture exceptions in a function and convert them to our custom exception types
    
    This decorator will catch any exception raised in the decorated function and
    convert it to a TaskException with the appropriate category and details.
    
    Args:
        func: The function to decorate
        
    Returns:
        The decorated function that handles exceptions
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except TaskException:
            # Our custom exceptions already have the right format, just reraise
            raise
        except Exception as e:
            # For other exceptions, convert to our format with traceback
            context = "In function: {}".format(func.__name__)
            error_message = "An error occurred: {}".format(str(e))
            
            generic_error = TaskException(
                message=error_message,
                error_code=ErrorCode.UNEXPECTED_ERROR,
                category=ErrorCategory.UNKNOWN,
                severity=ErrorSeverity.ERROR,
                details={
                    'context': context,
                    'exception_type': e.__class__.__name__,
                    'traceback': traceback.format_exc()
                },
                suggestion="Please try again or contact anttila@stanford.edu if the problem persists."
            )
            
            raise generic_error
    
    return wrapper


def handle_exception(
    exception, 
    context="Unknown context"
):
    """
    Handle an exception and convert it to a standardized error format
    
    Args:
        exception: The exception to handle
        context: Context where the exception occurred
        
    Returns:
        Dictionary with the error information
    """
    # If it's already our custom exception, just return its dict representation
    if isinstance(exception, TaskException):
        return exception.to_dict()
    
    # Otherwise, wrap the generic exception
    error = TaskException(
        message=str(exception),
        error_code=ErrorCode.UNEXPECTED_ERROR,
        category=ErrorCategory.UNKNOWN,
        severity=ErrorSeverity.ERROR,
        details={
            'context': context,
            'exception_type': exception.__class__.__name__,
            'traceback': traceback.format_exc()
        },
        suggestion="Please try again or contact anttila@stanford.edu if the problem persists"
    )
    
    return error.to_dict()


def format_error_for_user(exception):
    """
    Format an error for user display
    
    This function creates a user-friendly error object that can be displayed
    in the UI. It removes technical details that wouldn't be helpful to the user
    and adds more context when available.
    
    Args:
        exception: The exception to format or an error dictionary
        
    Returns:
        Dictionary with user-friendly error information
    """
    # Convert exception to dictionary if needed
    error_dict = exception.to_dict() if isinstance(exception, TaskException) else exception
    
    if isinstance(error_dict, dict):
        # Create a copy to avoid modifying the original
        user_friendly = dict(error_dict)
        
        # Include only the most important fields, sanitize as needed
        if 'details' in user_friendly and isinstance(user_friendly['details'], dict):
            # Remove potentially sensitive or confusing technical details
            sanitized_details = {}
            for key, value in user_friendly['details'].items():
                if key not in ['traceback', 'exception_traceback', 'stack_trace']:
                    sanitized_details[key] = value
            user_friendly['details'] = sanitized_details
        
        return user_friendly
    else:
        # Fallback for unexpected error format
        return {
            'message': str(exception) if isinstance(exception, Exception) else 'An error occurred',
            'category': 'unknown',
            'category_description': 'Unknown Error',
            'severity': 'error',
            'suggestion': 'Please try again or contact anttila@stanford.edu if the problem persists.'
        }


def validate_input_text(text):
    """
    Validate input text for processing
    
    Args:
        text: The input text to validate
        
    Raises:
        InputValidationException: If the text is invalid
    """
    if not text:
        raise InputValidationException(
            message="Empty input text",
            error_code=ErrorCode.EMPTY_INPUT,
            suggestion="Please provide non-empty text for analysis"
        )
    
    if len(text.strip()) < 5:
        raise InputValidationException(
            message="Input text too short",
            error_code=ErrorCode.INVALID_VALUE,
            details={'text_length': len(text.strip())},
            suggestion="Please provide longer text for meaningful analysis (at least 5 characters)"
        )


def process_error_for_api_response(
    error,
    context="Unknown context"
):
    """
    Process an error for API response format
    
    Args:
        error: The error to process (either an exception or error dict)
        context: Context where the error occurred
        
    Returns:
        Dictionary formatted for API response
    """
    error_details = handle_exception(error, context) if isinstance(error, Exception) else error
    
    response = {
        'status': 'FAILURE',
        'error': True,
        'errorMessage': error_details.get('message', 'An error occurred'),
        'errorDetails': error_details
    }
    
    return response

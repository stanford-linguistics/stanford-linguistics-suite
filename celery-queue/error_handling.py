"""
Error handling module for the Metrical Tree processing

This module defines exception classes and utilities for classifying,
categorizing, and providing meaningful error messages for the various
types of errors that can occur during metrical tree processing.
"""

import enum
import json
import traceback
from typing import Dict, Any, Optional, Union, Callable, TypeVar, cast
from functools import wraps


class ErrorSeverity(str, enum.Enum):
    """Severity levels for errors"""
    WARNING = "warning"     # User can continue but may get suboptimal results
    ERROR = "error"         # Fatal error that prevents completion
    CRITICAL = "critical"   # System-level error that needs urgent attention


class ErrorCategory(str, enum.Enum):
    """Categories of errors to help guide troubleshooting"""
    INPUT_VALIDATION = "input_validation"      # Input data format errors
    LINGUISTIC_PROCESSING = "linguistic_processing"  # Language processing errors
    COMPUTATIONAL = "computational"    # Resource or computation errors
    SYSTEM = "system"                  # System or environment errors
    UNKNOWN = "unknown"                # Uncategorized/unexpected errors


class ErrorCode(str, enum.Enum):
    """Specific error codes for detailed error classification"""
    # Input validation errors
    INVALID_FORMAT = "invalid_format"
    MISSING_REQUIRED_FIELD = "missing_required_field"
    INVALID_VALUE = "invalid_value"
    EMPTY_INPUT = "empty_input"
    MALFORMED_TEXT = "malformed_text"
    INPUT_TOO_LARGE = "input_too_large"
    ENCODING_ERROR = "encoding_error"
    
    # Linguistic processing errors
    PARSER_FAILURE = "parser_failure"
    TOKENIZATION_ERROR = "tokenization_error"
    DICTIONARY_LOOKUP_FAILURE = "dictionary_lookup_failure"
    SYLLABIFICATION_ERROR = "syllabification_error"
    AMBIGUOUS_WORD = "ambiguous_word"
    SYLLABUS_LOOKUP_FAILURE = "syllabus_lookup_failure"
    AMBIGUITY_RESOLUTION_FAILURE = "ambiguity_resolution_failure"
    
    # Computational errors
    TIMEOUT = "timeout"
    MEMORY_LIMIT_EXCEEDED = "memory_limit_exceeded"
    COMPUTATION_FAILED = "computation_failed"
    
    # System errors
    FILE_SYSTEM_ERROR = "file_system_error"
    FILE_NOT_FOUND = "file_not_found"
    PERMISSION_DENIED = "permission_denied"
    DEPENDENCY_MISSING = "dependency_missing"
    CONFIGURATION_ERROR = "configuration_error"
    DATABASE_ERROR = "database_error"
    
    # Unknown errors
    UNEXPECTED_ERROR = "unexpected_error"


class MetricalTreeException(Exception):
    """Base exception class for Metrical Tree errors"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.UNEXPECTED_ERROR,
        category: ErrorCategory = ErrorCategory.UNKNOWN,
        severity: ErrorSeverity = ErrorSeverity.ERROR,
        details: Optional[Dict[str, Any]] = None,
        suggestion: Optional[str] = None,
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
        super().__init__(message)
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
    
    def to_dict(self) -> Dict[str, Any]:
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
    
    def _get_category_description(self) -> str:
        """Get a human-readable description of the error category"""
        descriptions = {
            ErrorCategory.INPUT_VALIDATION: "Input Validation Error",
            ErrorCategory.LINGUISTIC_PROCESSING: "Linguistic Processing Error",
            ErrorCategory.COMPUTATIONAL: "System Resource Error",
            ErrorCategory.SYSTEM: "System Error",
            ErrorCategory.UNKNOWN: "Unknown Error"
        }
        return descriptions.get(self.category, "Error")
    
    def to_json(self) -> str:
        """
        Convert the exception to a JSON string
        
        Returns:
            JSON string representation of the exception
        """
        return json.dumps(self.to_dict())


class InputValidationException(MetricalTreeException):
    """Exception for input validation errors"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.INVALID_FORMAT,
        details: Optional[Dict[str, Any]] = None,
        suggestion: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.INPUT_VALIDATION,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion,
            **kwargs
        )


class LinguisticProcessingException(MetricalTreeException):
    """Exception for linguistic processing errors"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.PARSER_FAILURE,
        details: Optional[Dict[str, Any]] = None,
        suggestion: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.LINGUISTIC_PROCESSING,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion,
            **kwargs
        )


class ComputationalException(MetricalTreeException):
    """Exception for computational resource errors"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.COMPUTATION_FAILED,
        details: Optional[Dict[str, Any]] = None,
        suggestion: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.COMPUTATIONAL,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion,
            **kwargs
        )


class SystemException(MetricalTreeException):
    """Exception for system-level errors"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode = ErrorCode.CONFIGURATION_ERROR,
        details: Optional[Dict[str, Any]] = None,
        suggestion: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.SYSTEM,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion,
            **kwargs
        )


F = TypeVar('F', bound=Callable[..., Any])


def capture_exception(func: F) -> F:
    """
    Decorator to capture exceptions in a function and convert them to our custom exception types
    
    This decorator will catch any exception raised in the decorated function and
    convert it to a MetricalTreeException with the appropriate category and details.
    
    Args:
        func: The function to decorate
        
    Returns:
        The decorated function that handles exceptions
    """
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return func(*args, **kwargs)
        except MetricalTreeException:
            # Our custom exceptions already have the right format, just reraise
            raise
        except Exception as e:
            # For other exceptions, convert to our format with traceback
            context = f"In function: {func.__name__}"
            error_message = f"An error occurred: {str(e)}"
            
            generic_error = MetricalTreeException(
                message=error_message,
                error_code=ErrorCode.UNEXPECTED_ERROR,
                category=ErrorCategory.UNKNOWN,
                severity=ErrorSeverity.ERROR,
                details={
                    'context': context,
                    'exception_type': e.__class__.__name__,
                    'traceback': traceback.format_exc()
                },
                suggestion="Please try again or contact support if the problem persists."
            )
            
            raise generic_error from e
    
    return cast(F, wrapper)


def handle_exception(
    exception: Exception, 
    context: str = "Unknown context"
) -> Dict[str, Any]:
    """
    Handle an exception and convert it to a standardized error format
    
    Args:
        exception: The exception to handle
        context: Context where the exception occurred
        
    Returns:
        Dictionary with the error information
    """
    # If it's already our custom exception, just return its dict representation
    if isinstance(exception, MetricalTreeException):
        return exception.to_dict()
    
    # Otherwise, wrap the generic exception
    error = MetricalTreeException(
        message=str(exception),
        error_code=ErrorCode.UNEXPECTED_ERROR,
        category=ErrorCategory.UNKNOWN,
        severity=ErrorSeverity.ERROR,
        details={
            'context': context,
            'exception_type': exception.__class__.__name__,
            'traceback': traceback.format_exc()
        },
        suggestion="Please try again or contact support if the problem persists"
    )
    
    return error.to_dict()


def format_error_for_user(exception: Union[Exception, Dict[str, Any]]) -> Dict[str, Any]:
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
    error_dict = exception.to_dict() if isinstance(exception, MetricalTreeException) else exception
    
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
            'suggestion': 'Please try again or contact support if the problem persists.'
        }


def validate_input_text(text: str) -> None:
    """
    Validate input text for metrical tree processing
    
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
    
    # Add more validation rules as needed
    # For example, check for minimum length, valid characters, etc.
    if len(text.strip()) < 5:
        raise InputValidationException(
            message="Input text too short",
            error_code=ErrorCode.INVALID_VALUE,
            details={'text_length': len(text.strip())},
            suggestion="Please provide longer text for meaningful analysis (at least 5 characters)"
        )


def process_error_for_api_response(
    error: Union[Exception, Dict[str, Any]],
    context: str = "Unknown context"
) -> Dict[str, Any]:
    """
    Process an error for API response format
    
    Args:
        error: The error to process (either an exception or error dict)
        context: Context where the error occurred
        
    Returns:
        Dictionary formatted for API response
    """
    # Get the error details
    error_details = handle_exception(error, context) if isinstance(error, Exception) else error
    
    # Format for API response
    response = {
        'status': 'FAILURE',
        'error': True,
        'errorMessage': error_details.get('message', 'An error occurred'),
        'errorDetails': error_details
    }
    
    return response

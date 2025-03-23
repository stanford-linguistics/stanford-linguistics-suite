"""
Test endpoint for generating errors to test the error display UI
This module is for development/testing only and should be disabled in production
"""

from flask import Blueprint, jsonify, request, url_for, make_response, current_app as app
import json
import os
import uuid
import traceback
import time
import enum
from worker import celery
from . import routes

# Define error-related enums locally for test purposes
class ErrorSeverity(str, enum.Enum):
    """Severity levels for errors"""
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class ErrorCategory(str, enum.Enum):
    """Categories of errors to help guide troubleshooting"""
    INPUT_VALIDATION = "input_validation"
    LINGUISTIC_PROCESSING = "linguistic_processing"
    COMPUTATIONAL = "computational"
    SYSTEM = "system"
    UNKNOWN = "unknown"

class ErrorCode(str, enum.Enum):
    """Specific error codes for detailed error classification"""
    # Input validation errors
    INVALID_FORMAT = "invalid_format"
    MISSING_REQUIRED_FIELD = "missing_required_field"
    INVALID_VALUE = "invalid_value"
    EMPTY_INPUT = "empty_input"
    MALFORMED_TEXT = "malformed_text"
    
    # Linguistic processing errors
    PARSER_FAILURE = "parser_failure"
    TOKENIZATION_ERROR = "tokenization_error"
    DICTIONARY_LOOKUP_FAILURE = "dictionary_lookup_failure"
    SYLLABIFICATION_ERROR = "syllabification_error"
    AMBIGUOUS_WORD = "ambiguous_word"
    
    # Computational errors
    TIMEOUT = "timeout"
    MEMORY_LIMIT_EXCEEDED = "memory_limit_exceeded"
    COMPUTATION_FAILED = "computation_failed"
    
    # System errors
    FILE_SYSTEM_ERROR = "file_system_error"
    DEPENDENCY_MISSING = "dependency_missing"
    CONFIGURATION_ERROR = "configuration_error"
    DATABASE_ERROR = "database_error"
    
    # Unknown errors
    UNEXPECTED_ERROR = "unexpected_error"

# Define exception classes locally for test purposes
class MetricalTreeException(Exception):
    """Base exception class for Metrical Tree errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.UNEXPECTED_ERROR,
        category=ErrorCategory.UNKNOWN,
        severity=ErrorSeverity.ERROR,
        details=None,
        suggestion=None
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.category = category
        self.severity = severity
        self.details = details or {}
        self.suggestion = suggestion
    
    def to_dict(self):
        """Convert the exception to a dictionary that can be serialized to JSON"""
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

class InputValidationException(MetricalTreeException):
    """Exception for input validation errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.INVALID_FORMAT,
        details=None,
        suggestion=None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.INPUT_VALIDATION,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion
        )

class LinguisticProcessingException(MetricalTreeException):
    """Exception for linguistic processing errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.PARSER_FAILURE,
        details=None,
        suggestion=None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.LINGUISTIC_PROCESSING,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion
        )

class ComputationalException(MetricalTreeException):
    """Exception for computational resource errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.COMPUTATION_FAILED,
        details=None,
        suggestion=None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.COMPUTATIONAL,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion
        )

class SystemException(MetricalTreeException):
    """Exception for system-level errors"""
    
    def __init__(
        self,
        message,
        error_code=ErrorCode.CONFIGURATION_ERROR,
        details=None,
        suggestion=None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            category=ErrorCategory.SYSTEM,
            severity=ErrorSeverity.ERROR,
            details=details,
            suggestion=suggestion
        )

# Create a Blueprint for test endpoints
test_routes = Blueprint('test_routes', __name__)

def get_folder_id():
    """Generate a unique folder ID for the test result"""
    return str(uuid.uuid4())

@test_routes.route('/generate_error/<string:error_type>', methods=['POST'])
def generate_error(error_type):
    """
    Generate a test error of the specified type
    
    This endpoint is for testing the error display UI. It creates a computation
    that will fail with the specified error type.
    
    Args:
        error_type: The type of error to generate. One of:
            - input_validation: Input validation error
            - linguistic_processing: Linguistic processing error
            - computational: System resource error
            - system: System error
            - unknown: Unknown error
            
    Returns:
        JSON response with the test result
    """
    try:
        # Generate a folder ID
        folder_id = get_folder_id()
        
        # Generate a simulated computation ID
        computation_id = folder_id
        
        # Default parameters for the error display
        name = request.json.get('name', 'Test Error - ' + error_type.capitalize())
        description = request.json.get('description', 'Test error for UI testing')
        
        # Create a failure result based on the requested error type
        if error_type == 'input_validation':
            error = InputValidationException(
                message="Invalid input format",
                error_code=ErrorCode.INVALID_FORMAT,
                details={
                    "line": 42,
                    "column": 10,
                    "value": "malformed text",
                    "expected": "A valid sentence structure",
                    "context": "This doesn't follow proper sentence format..."
                },
                suggestion="Please check your input text and ensure it has proper formatting"
            )
            
        elif error_type == 'linguistic_processing':
            error = LinguisticProcessingException(
                message="Failed to process linguistic components",
                error_code=ErrorCode.PARSER_FAILURE,
                details={
                    "word": "antidisestablishmentarianism",
                    "position": "sentence 3, word 7",
                    "parser_output": "Failed to parse complex word structure",
                    "context": "...the principles of antidisestablishmentarianism have been..."
                },
                suggestion="Try simplifying your text or breaking complex words into smaller parts"
            )
            
        elif error_type == 'computational':
            error = ComputationalException(
                message="Exceeded system computational resources",
                error_code=ErrorCode.MEMORY_LIMIT_EXCEEDED,
                details={
                    "memory_used": "8.2GB",
                    "memory_limit": "8GB",
                    "text_length": "152KB",
                    "processing_time": "45s before failure",
                },
                suggestion="Try processing a smaller text sample"
            )
            
        elif error_type == 'system':
            error = SystemException(
                message="Server configuration issue detected",
                error_code=ErrorCode.DEPENDENCY_MISSING,
                details={
                    "missing_dependency": "stanford-parser",
                    "version_required": "3.5.2",
                    "path_checked": "/usr/local/lib/stanford-parser",
                    "system_error": "ImportError: Cannot load required library",
                },
                suggestion="Please contact system administrator to reinstall the required dependencies"
            )
            
        else:  # unknown or any other value
            error = MetricalTreeException(
                message="An unexpected error occurred",
                error_code=ErrorCode.UNEXPECTED_ERROR,
                category=ErrorCategory.UNKNOWN,
                severity=ErrorSeverity.ERROR,
                details={
                    "error_type": "Unknown",
                    "traceback": "Simulated traceback:\n  File 'app.py', line 123\n  File 'worker.py', line 45\n  ..."
                },
                suggestion="Please try again or contact support if the problem persists"
            )
        
        # Create a structured response that mimics a real computation
        response_data = {
            "id": computation_id,
            "name": name,
            "description": description,
            "status": "FAILURE",
            "error": True,
            "errorMessage": error.message,
            "errorDetails": error.to_dict(),
            "params": {
                "unstressed_words": ["the", "a", "an", "of"],
                "unstressed_tags": ["DT", "IN"],
                "unstressed_deps": [],
                "ambiguous_words": [],
                "ambiguous_tags": [],
                "ambiguous_deps": [],
                "stressed_words": []
            }
        }
        
        # Return the response
        return make_response(jsonify(response_data), 201)
            
    except Exception as e:
        # Log the real error
        app.logger.error(f"Error in generate_error endpoint: {str(e)}")
        app.logger.error(traceback.format_exc())
        
        # Return a generic error response
        error_response = {
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while creating test error",
            "suggestion": "Please try again or contact support if the problem persists"
        }
        
        return jsonify(error_response), 500


# Register the blueprint
def register_test_routes(app):
    """Register test routes with the Flask app"""
    app.register_blueprint(test_routes, url_prefix='/api/test')

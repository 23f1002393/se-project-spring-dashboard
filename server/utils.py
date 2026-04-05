# Common utilities for the Flask application

# Standered error function
def error_response(code, message, details=None):
    """Standardized error format for the API"""
    response = {"error": {"code": code, "message": message}}
    if details:
        response["error"]["details"] = details
    return response, code

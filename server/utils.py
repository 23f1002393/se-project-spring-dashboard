# Common utilities for the Flask application
from datetime import datetime, timezone

# Standard error function
def error_response(code, message, details=None):
    """Standardized error format for the API as per AGENTS.md"""
    return {
        "status": "error",
        "message": message,
        "code": code,
        "details": details
    }, code


def log_audit(entity_type, entity_id, action, user_id=None, details=None):
    """Log an action for auditing purposes"""
    from models import AuditLog, db
    log = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        user_id=user_id,
        details=details
    )
    db.session.add(log)
    db.session.commit()

import pytest
from models import AuditLog

def test_audit_logs_existence(client, init_database):
    """Verify that audit logs are created for critical actions (like quotation revision)"""
    # Revise quotation to trigger audit log
    client.post("/api/v1/quotations/1/revise", json={
        "price": 1600.0
    })
    
    # Check if audit log was created
    with client.application.app_context():
        logs = AuditLog.query.filter_by(entity_type="Quotation", action="Revised").all()
        assert len(logs) > 0

import pytest
from models import AuditLog

def test_quality_report_and_auto_invoice(client, init_database):
    """Test recording quality report and verifying auto-invoice generation"""
    # Create task
    response = client.post("/api/v1/tasks", json={
        "order_id": 1,
        "machine_id": 1,
        "material_id": 1,
        "scheduled_at": "2026-04-20T10:00:00",
        "material_required": 5.0
    })
    task_id = response.get_json()["task_id"]
    
    # Record Approved Quality Report
    response = client.post(f"/api/v1/tasks/{task_id}/quality", json={
        "inspector": "John Inspector",
        "result": "Approved"
    })
    assert response.status_code == 201
    assert "report_id" in response.get_json()
    
    # Verify order status updated to Invoiced (due to auto-invoice)
    response = client.get("/api/v1/orders/1")
    assert response.get_json()["production_status"] == "Invoiced - Pending Dispatch"

def test_manual_invoice_override(client, init_database):
    """Test manual invoice generation with override amount"""
    # Order 1 is ready for billing
    response = client.post("/api/v1/orders/1/invoice", json={
        "manual_amount": 2000.0
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data["amount"] == 2000.0
    
    # Check audit log for pricing override
    with client.application.app_context():
        logs = AuditLog.query.filter_by(action="Pricing Override").all()
        assert len(logs) > 0

def test_qc_rejection_trigger_rework(client, init_database):
    """Test that QC rejection updates order status for rework"""
    # Create task
    response = client.post("/api/v1/tasks", json={
        "order_id": 1,
        "machine_id": 1,
        "material_id": 1,
        "scheduled_at": "2026-04-20T10:00:00",
        "material_required": 5.0
    })
    task_id = response.get_json()["task_id"]
    
    # Record Rejected Quality Report
    response = client.post(f"/api/v1/tasks/{task_id}/quality", json={
        "inspector": "John Inspector",
        "result": "Rejected",
        "rejection_reason": "Incorrect dimensions"
    })
    assert response.status_code == 201
    
    # Verify order status
    response = client.get("/api/v1/orders/1")
    assert response.get_json()["production_status"] == "Failed QC - Rework Required"

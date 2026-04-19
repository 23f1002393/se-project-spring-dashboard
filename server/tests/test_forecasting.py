import pytest

def test_raw_material_forecast(client, init_database):
    """Test raw material forecasting endpoint"""
    response = client.get("/api/v1/analytics/raw-material-forecast?horizon_days=30&lookback_days=90")
    assert response.status_code == 200
    data = response.get_json()
    assert "summary" in data
    assert "materials" in data
    assert "top_ten" in data
    assert "chart_data" in data
    
    # Check if our seeded material is in the rows
    materials = data["materials"]
    assert len(materials) > 0
    assert any(m["material_name"] == "Steel Wire" for m in materials)

def test_machine_maintenance_list(client, init_database):
    """Test machine maintenance list endpoint"""
    response = client.get("/api/v1/machines/maintenance")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    
    machine = data[0]
    assert "usage_since_maintenance" in machine
    assert "severity" in machine
    assert "utilization_percent" in machine
    
    # Since we seeded a task with 5000 springs and threshold is 10000
    assert machine["usage_since_maintenance"] == 5000
    assert machine["utilization_percent"] == 50.0
    assert machine["severity"] == "ok"

def test_record_maintenance_action(client, init_database):
    """Test recording a maintenance event"""
    # 1. Verify usage before maintenance
    response = client.get("/api/v1/machines/maintenance")
    machine_before = response.get_json()[0]
    assert machine_before["usage_since_maintenance"] > 0
    
    # 2. Record maintenance
    machine_id = machine_before["machine_id"]
    response = client.post(f"/api/v1/machines/{machine_id}/maintenance")
    assert response.status_code == 200
    assert "Maintenance recorded" in response.get_json()["message"]
    
    # 3. Verify usage is reset (because maintenance_at is now after task dates)
    response = client.get("/api/v1/machines/maintenance")
    machine_after = response.get_json()[0]
    assert machine_after["usage_since_maintenance"] == 0
    assert machine_after["utilization_percent"] == 0.0

def test_task_scheduling_with_estimated_output(client, init_database):
    """Test scheduling task with estimated_springs_produced"""
    response = client.post("/api/v1/tasks", json={
        "order_id": 1,
        "machine_id": 1,
        "material_id": 1,
        "scheduled_at": "2026-04-30T10:00:00",
        "material_required": 5.0,
        "estimated_springs_produced": 2500
    })
    assert response.status_code == 201
    task_id = response.get_json()["task_id"]
    
    # Check if task correctly stored the estimate
    response = client.get("/api/v1/tasks")
    tasks = response.get_json()
    task = next(t for t in tasks if t["id"] == task_id)
    assert task["estimated_springs_produced"] == 2500

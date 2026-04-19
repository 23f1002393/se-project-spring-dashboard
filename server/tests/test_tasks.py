import pytest

def test_production_task_scheduling(client, init_database):
    """Test scheduling a production task"""
    response = client.post("/api/v1/tasks", json={
        "order_id": 1,
        "machine_id": 1,
        "material_id": 1,
        "scheduled_at": "2026-04-20T10:00:00",
        "material_required": 10.0
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "task_id" in data

def test_task_status_update(client, init_database):
    """Test updating task status"""
    # First create a task
    response = client.post("/api/v1/tasks", json={
        "order_id": 1,
        "machine_id": 1,
        "material_id": 1,
        "scheduled_at": "2026-04-20T10:00:00",
        "material_required": 5.0
    })
    task_id = response.get_json()["task_id"]
    
    response = client.put(f"/api/v1/tasks/{task_id}/status", json={
        "status": "In Progress"
    })
    assert response.status_code == 200
    assert response.get_json()["message"] == "Task status updated to In Progress"

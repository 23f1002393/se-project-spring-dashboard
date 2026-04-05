import json

def test_07_schedule_task(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/tasks"
    payload = {
        "order_id": 3,
        "machine_id": 1,
        "material_id": 1,
        "scheduled_at": "2026-05-01T10:00:00",
        "material_required": 20.0,
    }
    response = client.post("/api/v1/tasks", json=payload)
    actual = response.get_json()
    expected = {
        "message": "Production task scheduled and materials reserved",
        "task_id": 1,
    }
    print_test_case(
        7,
        "Schedule Task (Epic 2)",
        url,
        "POST",
        json.dumps(payload),
        201,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 201

def test_08_update_task_status(client, init_database, print_test_case):
    # Setup: Call schedule task to ensure task 1 exists
    client.post(
        "/api/v1/tasks",
        json={
            "order_id": 3,
            "machine_id": 1,
            "material_id": 1,
            "scheduled_at": "2026-05-01T10:00:00",
            "material_required": 10.0,
        },
    )

    url = "http://127.0.0.1:5000/api/v1/tasks/1/status"
    payload = {"status": "In Progress"}
    response = client.put("/api/v1/tasks/1/status", json=payload)
    actual = response.get_json()
    expected = {"message": "Task status updated to In Progress"}
    print_test_case(
        8,
        "Update Production Progress",
        url,
        "PUT",
        json.dumps(payload),
        200,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 200

def test_09_quality_control(client, init_database, print_test_case):
    # Ensure task 1 exists
    client.post(
        "/api/v1/tasks",
        json={
            "order_id": 3,
            "machine_id": 1,
            "material_id": 1,
            "scheduled_at": "2026-05-01T10:00:00",
            "material_required": 10.0,
        },
    )

    url = "http://127.0.0.1:5000/api/v1/tasks/1/quality"
    payload = {"inspector": "Mike Foreman", "result": "Approved"}
    response = client.post("/api/v1/tasks/1/quality", json=payload)
    actual = response.get_json()
    expected = {"message": "Quality report recorded: Approved", "report_id": 1}
    print_test_case(
        9,
        "Submit Quality Report",
        url,
        "POST",
        json.dumps(payload),
        201,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 201

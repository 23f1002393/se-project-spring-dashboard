import pytest

def test_order_listing(client, init_database):
    """Test fetching all orders"""
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) >= 2


def test_create_order_success(client, init_database):
    """Test creating a production order with valid quote and spring IDs"""
    response = client.post(
        "/api/v1/orders",
        json={"quote_id": 1, "spring_id": 1, "production_status": "Pending"},
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "Order created successfully"
    assert data["quote_id"] == 1
    assert data["spring_id"] == 1
    assert data["production_status"] == "Pending"
    assert "order_id" in data


def test_create_order_missing_quote_id(client, init_database):
    """Test creating order fails when quote_id is missing"""
    response = client.post("/api/v1/orders", json={"spring_id": 1})

    assert response.status_code == 400
    data = response.get_json()
    assert data["status"] == "error"
    assert data["message"] == "quote_id is required"

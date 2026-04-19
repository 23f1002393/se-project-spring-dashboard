import pytest

def test_shipment_dispatch(client, init_database):
    """Test dispatching an order (Order 2 is already invoiced in init_database)"""
    response = client.post("/api/v1/orders/2/shipment", json={
        "carrier": "DHL Express",
        "tracking_number": "DHL-123456"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "shipment_id" in data

def test_delivery_update_and_feedback(client, init_database):
    """Test updating delivery status and providing feedback"""
    response = client.put("/api/v1/shipments/1/delivery", json={
        "delivery_status": "Delivered & Accepted",
        "customer_feedback": "Excellent quality, arrived early."
    })
    assert response.status_code == 200
    assert response.get_json()["message"] == "Delivery updated: Delivered & Accepted"

import pytest

def test_order_listing(client, init_database):
    """Test fetching all orders"""
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) >= 2

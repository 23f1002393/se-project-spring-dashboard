import pytest

def test_inventory_summary(client, init_database):
    """Test fetching inventory summary"""
    response = client.get("/api/v1/inventory")
    assert response.status_code == 200
    data = response.get_json()
    assert "materials" in data
    assert "machines" in data
    assert "finished_goods" in data

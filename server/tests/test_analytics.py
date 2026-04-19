import pytest

def test_financial_analytics(client, init_database):
    """Test fetching financial analytics"""
    response = client.get("/api/v1/analytics/financials")
    assert response.status_code == 200
    data = response.get_json()
    assert "total_revenue" in data

def test_production_analytics(client, init_database):
    """Test fetching production analytics"""
    response = client.get("/api/v1/analytics/production")
    assert response.status_code == 200
    data = response.get_json()
    assert "total_tasks" in data

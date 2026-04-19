import pytest

def test_enquiry_creation(client, init_database):
    """Test creating a new enquiry"""
    response = client.post("/api/v1/enquiries", json={
        "customer_id": 1,
        "product_spec": "Compression Spring 50mm",
        "quantity": 1000
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "enquiry_id" in data
    assert data["message"] == "Enquiry created successfully"

def test_feasibility_check(client, init_database):
    """Test running feasibility check for an enquiry"""
    response = client.post("/api/v1/feasibility", json={
        "enquiry_id": 1
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "is_feasible" in data
    assert data["enquiry_id"] == 1

import pytest

def test_quotation_generation(client, init_database):
    """Test generating a quotation for an enquiry"""
    response = client.post("/api/v1/enquiries/1/quotations", json={
        "price": 1200.0,
        "est_delivery": "2026-05-20"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "quote_id" in data

def test_quotation_revision(client, init_database):
    """Test revising a quotation"""
    response = client.post("/api/v1/quotations/1/revise", json={
        "price": 1400.0,
        "est_delivery": "2026-05-25"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "new_quote_id" in data
    assert "revised to version 2" in data["message"]

def test_quotation_rejection(client, init_database):
    """Test rejecting a quotation with a reason"""
    response = client.put("/api/v1/enquiries/1/quotations", json={
        "quote_id": 1,
        "rejection_reason": "Price is too high"
    })
    assert response.status_code == 200
    assert response.get_json()["message"] == "Quotation rejected successfully"
    
    # Verify enquiry status
    response = client.get("/api/v1/enquiries/1")
    assert response.get_json()["status"] == "Rejected"
    assert response.get_json()["rejection_reason"] == "Price is too high"

def test_quotation_acceptance_and_order_creation(client, init_database):
    """Test accepting a quotation to create an order"""
    response = client.post("/api/v1/quotations/1/accept", json={
        "spring_id": 1
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "order_id" in data
    assert data["message"] == "Quotation accepted and Order confirmed"

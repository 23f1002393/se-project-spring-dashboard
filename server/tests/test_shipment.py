import json

def test_12_dispatch_shipment(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/orders/2/shipment"
    payload = {"carrier": "UPS", "tracking_number": "UPS987654"}
    response = client.post("/api/v1/orders/2/shipment", json=payload)
    actual = response.get_json()
    expected = {
        "message": "Order dispatched",
        "shipment_id": 2,
    }  # ID 2 because fixture has shipment 1
    print_test_case(
        12,
        "Dispatch Shipment",
        url,
        "POST",
        json.dumps(payload),
        201,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 201

def test_13_record_delivery(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/shipments/1/delivery"
    payload = {"delivery_status": "Delivered & Accepted"}
    response = client.put("/api/v1/shipments/1/delivery", json=payload)
    actual = response.get_json()
    expected = {"message": "Delivery updated: Delivered & Accepted"}
    print_test_case(
        13,
        "Record Delivery Status",
        url,
        "PUT",
        json.dumps(payload),
        200,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 200

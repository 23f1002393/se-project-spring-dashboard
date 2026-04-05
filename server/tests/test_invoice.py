import json

def test_10_generate_invoice(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/orders/1/invoice"
    payload = {"manual_amount": 1050.0}
    response = client.post("/api/v1/orders/1/invoice", json=payload)
    actual = response.get_json()
    expected = {
        "message": "Invoice generated successfully",
        "invoice_id": 2,
        "amount": 1050.0,
    }
    print_test_case(
        10,
        "Generate Invoice for Order",
        url,
        "POST",
        json.dumps(payload),
        201,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 201

def test_11_pay_invoice(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/invoices/1/pay"
    response = client.put("/api/v1/invoices/1/pay")
    actual = response.get_json()
    expected = {"message": "Invoice successfully marked as paid"}
    print_test_case(
        11,
        "Mark Invoice as Paid",
        url,
        "PUT",
        None,
        200,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 200

def test_16_validation_failure(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/orders/3/invoice"
    # Order 3 does not exist in fixture, should return 404
    response = client.post("/api/v1/orders/3/invoice", json={})
    actual = response.get_json()
    expected = {"error": {"code": 404, "message": "Order ID 3 not found"}}
    print_test_case(
        16,
        "Validation Failure - Invoice generation for missing Order",
        url,
        "POST",
        "{}",
        404,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 404

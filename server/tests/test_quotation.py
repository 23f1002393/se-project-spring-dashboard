import json


def test_03_generate_quotation(client, init_database, print_test_case):
    # Setup: Create Enquiry 2
    client.post("/api/v1/enquiries", json={"customer_id": 1})

    url = "http://127.0.0.1:5000/api/v1/enquiries/2/quotations"
    payload = {"price": 1200.50, "est_delivery": "2026-05-15"}
    response = client.post("/api/v1/enquiries/2/quotations", json=payload)
    actual = response.get_json()
    expected = {"message": "Quotation generated", "quote_id": 2}
    print_test_case(
        3,
        "Generate Quotation",
        url,
        "POST",
        json.dumps(payload),
        201,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 201


def test_04_revise_quotation(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/quotations/1/revise"
    payload = {"price": 1400.00}
    response = client.post("/api/v1/quotations/1/revise", json=payload)
    actual = response.get_json()
    expected = {"message": "Quotation revised to version 2", "new_quote_id": 3}
    print_test_case(
        4,
        "Revise Quotation",
        url,
        "POST",
        json.dumps(payload),
        201,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 201


def test_05_accept_quotation(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/quotations/1/accept"
    payload = {"spring_id": 1}
    response = client.post("/api/v1/quotations/1/accept", json=payload)
    actual = response.get_json()
    expected = {"message": "Quotation accepted and Order confirmed", "order_id": 3}
    print_test_case(
        5,
        "Accept Quotation (Create Order)",
        url,
        "POST",
        json.dumps(payload),
        201,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 201

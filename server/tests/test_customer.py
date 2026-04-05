import json

def test_01_get_customers(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/customers"
    response = client.get("/api/v1/customers")
    actual = response.get_json()
    expected = [
        {"customer_id": 1, "name": "Acme Corp", "company_name": "Acme Tractors"}
    ]
    print_test_case(
        1,
        "Retrieve Customer List",
        url,
        "GET",
        None,
        200,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 200

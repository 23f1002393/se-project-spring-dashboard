import json


def test_02_create_enquiry(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/enquiries"
    payload = {"customer_id": 1}
    response = client.post("/api/v1/enquiries", json=payload)
    actual = response.get_json()
    expected = {
        "message": "Enquiry created successfully",
        "enquiry_id": 2,
        "status": "New",
    }
    print_test_case(
        2,
        "Create a New Enquiry",
        url,
        "POST",
        json.dumps(payload),
        201,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 201

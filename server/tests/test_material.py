def test_06_get_materials(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/materials"
    response = client.get("/api/v1/materials")
    actual = response.get_json()
    expected = [
        {
            "material_id": 1,
            "name": "Steel Wire",
            "specification": None,
            "stock_quantity": 100.0,
        }
    ]
    print_test_case(
        6,
        "Check Material Inventory",
        url,
        "GET",
        None,
        200,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 200

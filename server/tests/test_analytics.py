def test_14_financial_analytics(client, init_database, print_test_case):
    # Note: Fixture creates 1 unpaid invoice for $1500. We just paid it in test_11 logic, but fixtures reset per test!
    url = "http://127.0.0.1:5000/api/v1/analytics/financials"
    response = client.get("/api/v1/analytics/financials")
    actual = response.get_json()
    expected = {
        "metrics": {
            "total_revenue": 1500.0,
            "collected_revenue": 0.0,
            "pending_revenue": 1500.0,
        },
        "chart_data": {
            "labels": ["Collected Revenue", "Pending Revenue"],
            "series": [0.0, 1500.0],
        },
    }
    print_test_case(
        14,
        "Get Financial Analytics",
        url,
        "GET",
        None,
        200,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 200


def test_15_production_analytics(client, init_database, print_test_case):
    url = "http://127.0.0.1:5000/api/v1/analytics/production"
    response = client.get("/api/v1/analytics/production")
    actual = response.get_json()

    # We expect our 2 fixture orders in the pipeline breakdown
    expected = {
        "machine_utilization": {"chart_type": "bar", "labels": [], "data": []},
        "production_pipeline": {
            "chart_type": "pie",
            "data": {
                "Invoiced - Pending Dispatch": 1,
                "Quality Approved - Ready for Billing": 1,
            },
        },
    }
    print_test_case(
        15,
        "Get Production Analytics",
        url,
        "GET",
        None,
        200,
        expected,
        response.status_code,
        actual,
    )
    assert response.status_code == 200

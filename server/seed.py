import pytest
import json
from app import app, db, Customer, Enquiry, Quotation, SpringMaster, Order, Machine, Material, ProductionTask, QualityReport, Invoice, Shipment

# ==========================================
# 1. Output Formatter Helper
# ==========================================
def print_test_case(test_num, name, url, method, req_json, exp_status, expected_dict, actual_status, actual_response_dict):
    """Formats and prints the test output exactly as requested."""
    actual_json_str = json.dumps(actual_response_dict)
    exp_json_str = json.dumps(expected_dict)
    
    print(f"\nTest Case {test_num}: {name}")
    print(f"Page being tested: {url}")
    print("Inputs:")
    print(f"    - Request Method: {method}")
    if req_json:
        print(f"    - JSON: {req_json}")
    print("    - Header: Content-Type: application/json")
    print("Expected Output:")
    print(f"    - HTTP Status Code: {exp_status}")
    print(f"    - JSON: {exp_json_str}")
    print("Actual Output:")
    print(f"    - HTTP Status Code: {actual_status}")
    print(f"    - JSON: {actual_json_str}")
    
    if actual_status == exp_status:
        print("Result: Success")
    else:
        print("Result: Failed")
    print("-" * 70)

# ==========================================
# 2. Pytest Fixtures (Setup & Teardown)
# ==========================================
@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

@pytest.fixture
def init_database():
    """Populates the database with necessary baseline data to support all 16 tests."""
    customer = Customer(name="Acme Corp", email="contact@acme.com", company_name="Acme Tractors")
    spring = SpringMaster(part_number="SP-100", wire_diameter=2.0)
    material = Material(name="Steel Wire", stock_quantity=100.0)
    machine = Machine(name="Coiler 1", type="Coiling", status="Active")
    db.session.add_all([customer, spring, material, machine])
    db.session.commit()

    # Pre-existing Enquiry (ID 1)
    enquiry = Enquiry(customer_id=1, status="Quoted")
    db.session.add(enquiry)
    db.session.commit()

    # Pre-existing Quote (ID 1)
    quote = Quotation(enquiry_id=1, version_number=1, price=1500.0, is_accepted=False)
    db.session.add(quote)
    db.session.commit()

    # Order ready for Invoicing (Order 1)
    order1 = Order(quote_id=1, spring_id=1, production_status="Quality Approved - Ready for Billing")
    db.session.add(order1)
    db.session.commit()

    # Order ready for Shipment (Order 2)
    order2 = Order(quote_id=1, spring_id=1, production_status="Invoiced - Pending Dispatch")
    invoice = Invoice(order_id=2, amount=1500.0, paid=False)
    db.session.add_all([order2, invoice])
    db.session.commit()

    # Shipment ready for Delivery (Shipment 1)
    shipment = Shipment(order_id=2, carrier="FedEx", tracking_number="TRK123")
    db.session.add(shipment)
    db.session.commit()

# ==========================================
# 3. All API Test Cases (Epic 1 to Epic 6)
# ==========================================

def test_01_get_customers(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/customers"
    response = client.get('/api/v1/customers')
    actual = response.get_json()
    expected = [{"customer_id": 1, "name": "Acme Corp", "company_name": "Acme Tractors"}]
    print_test_case(1, "Retrieve Customer List", url, "GET", None, 200, expected, response.status_code, actual)
    assert response.status_code == 200

def test_02_create_enquiry(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/enquiries"
    payload = {"customer_id": 1}
    response = client.post('/api/v1/enquiries', json=payload)
    actual = response.get_json()
    expected = {"message": "Enquiry created successfully", "enquiry_id": 2, "status": "New"}
    print_test_case(2, "Create a New Enquiry", url, "POST", json.dumps(payload), 201, expected, response.status_code, actual)
    assert response.status_code == 201

def test_03_generate_quotation(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/enquiries/2/quotations"
    payload = {"price": 1200.50, "est_delivery": "2026-05-15"}
    response = client.post('/api/v1/enquiries/2/quotations', json=payload)
    actual = response.get_json()
    expected = {"message": "Quotation generated", "quote_id": 2}
    print_test_case(3, "Generate Quotation", url, "POST", json.dumps(payload), 201, expected, response.status_code, actual)
    assert response.status_code == 201

def test_04_revise_quotation(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/quotations/1/revise"
    payload = {"price": 1400.00}
    response = client.post('/api/v1/quotations/1/revise', json=payload)
    actual = response.get_json()
    expected = {"message": "Quotation revised to version 2", "new_quote_id": 3}
    print_test_case(4, "Revise Quotation", url, "POST", json.dumps(payload), 201, expected, response.status_code, actual)
    assert response.status_code == 201

def test_05_accept_quotation(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/quotations/1/accept"
    payload = {"spring_id": 1}
    response = client.post('/api/v1/quotations/1/accept', json=payload)
    actual = response.get_json()
    expected = {"message": "Quotation accepted and Order confirmed", "order_id": 3}
    print_test_case(5, "Accept Quotation (Create Order)", url, "POST", json.dumps(payload), 201, expected, response.status_code, actual)
    assert response.status_code == 201

def test_06_get_materials(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/materials"
    response = client.get('/api/v1/materials')
    actual = response.get_json()
    expected = [{"material_id": 1, "name": "Steel Wire", "specification": None, "stock_quantity": 100.0}]
    print_test_case(6, "Check Material Inventory", url, "GET", None, 200, expected, response.status_code, actual)
    assert response.status_code == 200

def test_07_schedule_task(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/tasks"
    payload = {"order_id": 3, "machine_id": 1, "material_id": 1, "scheduled_at": "2026-05-01T10:00:00", "material_required": 20.0}
    response = client.post('/api/v1/tasks', json=payload)
    actual = response.get_json()
    expected = {"message": "Production task scheduled and materials reserved", "task_id": 1}
    print_test_case(7, "Schedule Task (Epic 2)", url, "POST", json.dumps(payload), 201, expected, response.status_code, actual)
    assert response.status_code == 201

def test_08_update_task_status(client, init_database):
    # Setup: Call schedule task to ensure task 1 exists
    client.post('/api/v1/tasks', json={"order_id": 3, "machine_id": 1, "material_id": 1, "scheduled_at": "2026-05-01T10:00:00", "material_required": 10.0})
    
    url = "http://127.0.0.1:5000/api/v1/tasks/1/status"
    payload = {"status": "In Progress"}
    response = client.put('/api/v1/tasks/1/status', json=payload)
    actual = response.get_json()
    expected = {"message": "Task status updated to In Progress"}
    print_test_case(8, "Update Production Progress", url, "PUT", json.dumps(payload), 200, expected, response.status_code, actual)
    assert response.status_code == 200

def test_09_quality_control(client, init_database):
    # Ensure task 1 exists
    client.post('/api/v1/tasks', json={"order_id": 3, "machine_id": 1, "material_id": 1, "scheduled_at": "2026-05-01T10:00:00", "material_required": 10.0})
    
    url = "http://127.0.0.1:5000/api/v1/tasks/1/quality"
    payload = {"inspector": "Mike Foreman", "result": "Approved"}
    response = client.post('/api/v1/tasks/1/quality', json=payload)
    actual = response.get_json()
    expected = {"message": "Quality report recorded: Approved", "report_id": 1}
    print_test_case(9, "Submit Quality Report", url, "POST", json.dumps(payload), 201, expected, response.status_code, actual)
    assert response.status_code == 201

def test_10_generate_invoice(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/orders/1/invoice"
    payload = {"manual_amount": 1050.0}
    response = client.post('/api/v1/orders/1/invoice', json=payload)
    actual = response.get_json()
    expected = {"message": "Invoice generated successfully", "invoice_id": 2, "amount": 1050.0}
    print_test_case(10, "Generate Invoice for Order", url, "POST", json.dumps(payload), 201, expected, response.status_code, actual)
    assert response.status_code == 201

def test_11_pay_invoice(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/invoices/1/pay"
    response = client.put('/api/v1/invoices/1/pay')
    actual = response.get_json()
    expected = {"message": "Invoice successfully marked as paid"}
    print_test_case(11, "Mark Invoice as Paid", url, "PUT", None, 200, expected, response.status_code, actual)
    assert response.status_code == 200

def test_12_dispatch_shipment(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/orders/2/shipment"
    payload = {"carrier": "UPS", "tracking_number": "UPS987654"}
    response = client.post('/api/v1/orders/2/shipment', json=payload)
    actual = response.get_json()
    expected = {"message": "Order dispatched", "shipment_id": 2} # ID 2 because fixture has shipment 1
    print_test_case(12, "Dispatch Shipment", url, "POST", json.dumps(payload), 201, expected, response.status_code, actual)
    assert response.status_code == 201

def test_13_record_delivery(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/shipments/1/delivery"
    payload = {"delivery_status": "Delivered & Accepted"}
    response = client.put('/api/v1/shipments/1/delivery', json=payload)
    actual = response.get_json()
    expected = {"message": "Delivery updated: Delivered & Accepted"}
    print_test_case(13, "Record Delivery Status", url, "PUT", json.dumps(payload), 200, expected, response.status_code, actual)
    assert response.status_code == 200

def test_14_financial_analytics(client, init_database):
    # Note: Fixture creates 1 unpaid invoice for $1500. We just paid it in test_11 logic, but fixtures reset per test!
    url = "http://127.0.0.1:5000/api/v1/analytics/financials"
    response = client.get('/api/v1/analytics/financials')
    actual = response.get_json()
    expected = {
        "metrics": {"total_revenue": 1500.0, "collected_revenue": 0.0, "pending_revenue": 1500.0},
        "chart_data": {"labels": ["Collected Revenue", "Pending Revenue"], "series": [0.0, 1500.0]}
    }
    print_test_case(14, "Get Financial Analytics", url, "GET", None, 200, expected, response.status_code, actual)
    assert response.status_code == 200

def test_15_production_analytics(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/analytics/production"
    response = client.get('/api/v1/analytics/production')
    actual = response.get_json()
    
    # We expect our 2 fixture orders in the pipeline breakdown
    expected = {
        "machine_utilization": {"chart_type": "bar", "labels": [], "data": []},
        "production_pipeline": {"chart_type": "pie", "data": {"Invoiced - Pending Dispatch": 1, "Quality Approved - Ready for Billing": 1}}
    }
    print_test_case(15, "Get Production Analytics", url, "GET", None, 200, expected, response.status_code, actual)
    assert response.status_code == 200

def test_16_validation_failure(client, init_database):
    url = "http://127.0.0.1:5000/api/v1/orders/3/invoice"
    # Order 3 does not exist in fixture, should return 404
    response = client.post('/api/v1/orders/3/invoice', json={})
    actual = response.get_json()
    expected = {"error": {"code": 404, "message": "Order ID 3 not found"}}
    print_test_case(16, "Validation Check (Not Found)", url, "POST", "{}", 404, expected, response.status_code, actual)
    assert response.status_code == 404

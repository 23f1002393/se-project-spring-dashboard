import pytest
import json

from app import app
from models import (
    db,
    User,
    Enquiry,
    Quotation,
    Spring,
    Order,
    Machine,
    Material,
    Invoice,
    Shipment,
)
import warnings
from sqlalchemy.exc import LegacyAPIWarning

warnings.filterwarnings("ignore", category=LegacyAPIWarning)

# Bind the db from models.py to the app explicitly so the models work.
if "sqlalchemy" in app.extensions:
    del app.extensions["sqlalchemy"]
db.init_app(app)


@pytest.fixture
def print_test_case():
    def _print_test_case(
        test_num,
        name,
        url,
        method,
        req_json,
        exp_status,
        expected_dict,
        actual_status,
        actual_response_dict,
    ):
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

    return _print_test_case


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


@pytest.fixture
def init_database():
    """Populates the database with necessary baseline data to support all tests."""
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    
    customer = User(
        name="Acme Corp", email="contact@acme.com", company_name="Acme Tractors", role="customer"
    )
    customer.set_password("TestPassword123!")
    spring = Spring(part_number="SP-100", wire_diameter=2.0)
    material = Material(name="Steel Wire", stock_quantity=100.0)
    machine = Machine(
        name="Coiler 1", 
        type="Coiling", 
        status="Active",
        maintenance_threshold=10000,
        maintenance_warning_threshold=8000,
        last_maintenance_at=now - timedelta(days=30)
    )
    db.session.add_all([customer, spring, material, machine])
    db.session.commit()

    # Pre-existing Enquiry (ID 1)
    enquiry = Enquiry(customer_id=customer.user_id, status="Quoted")
    db.session.add(enquiry)
    db.session.commit()

    # Pre-existing Quote (ID 1)
    quote = Quotation(enquiry_id=enquiry.enquiry_id, version_number=1, price=1500.0, is_accepted=False)
    db.session.add(quote)
    db.session.commit()

    # Order ready for Invoicing (Order 1)
    order1 = Order(
        quote_id=quote.quote_id,
        spring_id=spring.spring_id,
        production_status="Quality Approved - Ready for Billing",
    )
    db.session.add(order1)
    db.session.commit()

    # Order ready for Shipment (Order 2)
    order2 = Order(
        quote_id=quote.quote_id, spring_id=spring.spring_id, production_status="Invoiced - Pending Dispatch"
    )
    invoice = Invoice(order_id=order2.order_id, amount=1500.0, paid=False)
    db.session.add_all([order2, invoice])
    db.session.commit()

    # Shipment ready for Delivery (Shipment 1)
    shipment = Shipment(order_id=order2.order_id, carrier="FedEx", tracking_number="TRK123")
    db.session.add(shipment)
    db.session.commit()

    # Add a completed task for forecasting tests
    from models import ProductionTask
    completed_task = ProductionTask(
        order_id=order1.order_id,
        machine_id=machine.machine_id,
        material_id=material.material_id,
        status="Completed",
        estimated_springs_produced=5000,
        completed_at=now - timedelta(days=5),
        scheduled_at=now - timedelta(days=6)
    )
    db.session.add(completed_task)
    db.session.commit()

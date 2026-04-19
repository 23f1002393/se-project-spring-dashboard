from app import app
from models import (
    db,
    Enquiry,
    Quotation,
    Spring,
    Order,
    Machine,
    Material,
    ProductionTask,
    QualityReport,
    Invoice,
    User,
    Shipment,
    AuditLog,
)
import datetime as dt
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())


def seed_database():
    with app.app_context():
        # 1. Clear existing data
        print("Dropping existing tables...")
        db.drop_all()
        print("Creating fresh tables...")
        db.create_all()

        print("Populating database with seed data...")

        # 2. Add Users (Manager and Customers)
        manager = User(
            name="Spring Master",
            email=os.environ.get("MANAGER_EMAIL", "spring@master.com"),
            phone="555-0001",
            company_name="Spring Manufacturing Co.",
            role="manager",
        )
        manager.set_password(os.environ.get("MANAGER_PASSWORD", "Spring@123"))

        c1 = User(
            name="Alice Cooper",
            email="alice@auto-parts.com",
            phone="555-1111",
            company_name="AutoParts Inc.",
            role="customer",
        )
        c1.set_password("Customer123!")

        c2 = User(
            name="Bob Builder",
            email="bob@construction-tools.com",
            phone="555-2222",
            company_name="Construction Tools Ltd.",
            role="customer",
        )
        c2.set_password("Customer123!")

        db.session.add_all([manager, c1, c2])
        db.session.commit()

        # 3. Add Master Data (Springs, Machines, Materials)
        s1 = Spring(
            part_number="SP-COM-001",
            wire_diameter=2.0,
            material_spec="Stainless Steel",
            stock_quantity=50,
        )
        s2 = Spring(
            part_number="SP-EXT-002",
            wire_diameter=1.5,
            material_spec="Carbon Steel",
            stock_quantity=20,
        )
        s3 = Spring(
            part_number="SP-TOR-003",
            wire_diameter=3.0,
            material_spec="Alloy Steel",
            stock_quantity=0,
        )

        m1 = Machine(name="CNC Coiler 1", type="Coiling", status="Operational")
        m2 = Machine(name="CNC Coiler 2", type="Coiling", status="Operational")
        m3 = Machine(name="Grinder 1", type="Grinding", status="Operational")
        m4 = Machine(name="Shot Peener 1", type="Shot Peening", status="Maintenance")

        mat1 = Material(
            name="SS Wire 2.0mm", specification="SS304", stock_quantity=1000.0
        )
        mat2 = Material(
            name="CS Wire 1.5mm", specification="High Carbon", stock_quantity=200.0
        )
        mat3 = Material(
            name="Alloy Wire 3.0mm",
            specification="Chrome Silicon",
            stock_quantity=500.0,
        )

        db.session.add_all([s1, s2, s3, m1, m2, m3, m4, mat1, mat2, mat3])
        db.session.commit()

        # 4. Enquiry & Quotation Flow
        now = dt.datetime.now(dt.timezone.utc)

        # Scenario 1: Completed Lifecycle
        enq1 = Enquiry(
            customer_id=c1.user_id,
            product_spec="Compression spring for valve",
            quantity=500,
            status="Order Confirmed",
            created_at=now - dt.timedelta(days=20),
        )
        db.session.add(enq1)
        db.session.commit()

        quote1 = Quotation(
            enquiry_id=enq1.enquiry_id,
            version_number=1,
            price=1500.00,
            est_delivery=(now + dt.timedelta(days=10)).date(),
            is_accepted=True,
        )
        db.session.add(quote1)
        db.session.commit()

        # Scenario 2: Rejected Quotation
        enq2 = Enquiry(
            customer_id=c2.user_id,
            product_spec="Extension spring for door",
            quantity=200,
            status="Rejected",
            rejection_reason="Price exceeds budget",
            created_at=now - dt.timedelta(days=15),
        )
        db.session.add(enq2)
        db.session.commit()

        quote2 = Quotation(
            enquiry_id=enq2.enquiry_id,
            version_number=1,
            price=800.00,
            est_delivery=(now + dt.timedelta(days=5)).date(),
            is_accepted=False,
        )
        db.session.add(quote2)
        db.session.commit()

        # Scenario 3: New Enquiry
        enq3 = Enquiry(
            customer_id=c1.user_id,
            product_spec="Torsion spring for lever",
            quantity=1000,
            status="New",
            created_at=now - dt.timedelta(days=2),
        )
        db.session.add(enq3)
        db.session.commit()

        # 5. Orders & Tasks
        order1 = Order(
            quote_id=quote1.quote_id,
            spring_id=s1.spring_id,
            production_status="Delivered & Accepted - Closed",
        )
        db.session.add(order1)
        db.session.commit()

        # Order 2: In Production
        enq4 = Enquiry(
            customer_id=c2.user_id,
            product_spec="Batch 2",
            quantity=100,
            status="Order Confirmed",
        )
        db.session.add(enq4)
        db.session.commit()
        quote4 = Quotation(
            enquiry_id=enq4.enquiry_id,
            price=1000.0,
            est_delivery=(now + dt.timedelta(days=15)).date(),
            is_accepted=True,
        )
        db.session.add(quote4)
        db.session.commit()
        order2 = Order(
            quote_id=quote4.quote_id,
            spring_id=s2.spring_id,
            production_status="In Production",
        )
        db.session.add(order2)
        db.session.commit()

        task1 = ProductionTask(
            order_id=order1.order_id,
            machine_id=m1.machine_id,
            material_id=mat1.material_id,
            status="Completed",
            progress=100,
            scheduled_at=now - dt.timedelta(days=18),
            deadline=now - dt.timedelta(days=15),
            completed_at=now - dt.timedelta(days=16),
        )
        task2 = ProductionTask(
            order_id=order2.order_id,
            machine_id=m2.machine_id,
            material_id=mat2.material_id,
            status="In Progress",
            progress=45,
            scheduled_at=now - dt.timedelta(days=2),
            deadline=now + dt.timedelta(days=5),
        )
        db.session.add_all([task1, task2])
        db.session.commit()

        # 6. Quality Reports
        qr1 = QualityReport(
            task_id=task1.task_id,
            inspector="Quality Inspector A",
            result="Approved",
            report_date=now - dt.timedelta(days=16),
        )
        db.session.add(qr1)
        db.session.commit()

        # 7. Invoices
        inv1 = Invoice(
            order_id=order1.order_id,
            amount=1500.00,
            issued_date=(now - dt.timedelta(days=15)).date(),
            paid=True,
        )
        db.session.add(inv1)
        db.session.commit()

        # 8. Shipments
        ship1 = Shipment(
            order_id=order1.order_id,
            shipped_date=(now - dt.timedelta(days=14)).date(),
            carrier="FastLogistics",
            tracking_number="FL-998877",
            status="Delivered & Accepted",
            customer_feedback="Excellent quality and timely delivery.",
        )
        db.session.add(ship1)
        db.session.commit()

        # 9. Audit Logs
        log1 = AuditLog(
            entity_type="Quotation",
            entity_id=quote1.quote_id,
            action="Accepted",
            user_id=c1.user_id,
            details="Customer accepted quotation version 1",
            timestamp=now - dt.timedelta(days=19),
        )
        log2 = AuditLog(
            entity_type="QualityReport",
            entity_id=qr1.report_id,
            action="Approved",
            user_id=manager.user_id,
            details="Quality inspection passed for order 1",
            timestamp=now - dt.timedelta(days=16),
        )
        db.session.add_all([log1, log2])
        db.session.commit()

        print("Success! Database seeded with legal instances of all models.")


if __name__ == "__main__":
    seed_database()

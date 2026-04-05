from app import app, db, Customer, Enquiry, Quotation, SpringMaster, Order, Machine, Material, ProductionTask, QualityReport, Invoice, Shipment
from datetime import datetime, timedelta

def seed_database():
    with app.app_context():
        # 1. Clear existing data (Drops all tables and recreates them empty)
        print("Dropping existing tables...")
        db.drop_all()
        print("Creating fresh tables...")
        db.create_all()

        print("Populating database with fake data...")

        # 2. Add Customers
        c1 = Customer(name="John Doe", email="john@acmetractors.com", phone="555-0101", company_name="Acme Tractors")
        c2 = Customer(name="Jane Smith", email="jane@globalauto.com", phone="555-0202", company_name="Global AutoParts")
        db.session.add_all([c1, c2])
        db.session.commit()

        # 3. Add Master Data (Springs, Machines, Materials)
        s1 = SpringMaster(part_number="COMP-101", wire_diameter=2.5, material_spec="Stainless Steel 304")
        s2 = SpringMaster(part_number="EXT-202", wire_diameter=1.2, material_spec="High Carbon Steel")
        
        m1 = Machine(name="CNC Coiler A", type="Coiling", status="Active")
        m2 = Machine(name="Grinder B", type="Grinding", status="Active")
        
        mat1 = Material(name="SS-304 Wire", specification="2.5mm roll", stock_quantity=500.0)
        mat2 = Material(name="HC Steel Wire", specification="1.2mm roll", stock_quantity=150.0) # Low stock
        
        db.session.add_all([s1, s2, m1, m2, mat1, mat2])
        db.session.commit()

        # 4. Add Enquiries & Quotations
        # Enquiry 1: Fully processed into an Order
        enq1 = Enquiry(customer_id=c1.customer_id, status="Order Confirmed", created_at=datetime.utcnow() - timedelta(days=10))
        db.session.add(enq1)
        db.session.commit()

        quote1 = Quotation(enquiry_id=enq1.enquiry_id, version_number=1, price=2500.00, est_delivery=datetime.utcnow().date() + timedelta(days=5), is_accepted=True)
        db.session.add(quote1)
        db.session.commit()

        # Enquiry 2: Still pending
        enq2 = Enquiry(customer_id=c2.customer_id, status="Pending", created_at=datetime.utcnow() - timedelta(days=2))
        db.session.add(enq2)
        db.session.commit()

        # 5. Add Orders & Production Tasks
        order1 = Order(quote_id=quote1.quote_id, spring_id=s1.spring_id, production_status="Quality Approved - Ready for Billing")
        db.session.add(order1)
        db.session.commit()

        task1 = ProductionTask(order_id=order1.order_id, machine_id=m1.machine_id, material_id=mat1.material_id, status="Completed", scheduled_at=datetime.utcnow() - timedelta(days=8), completed_at=datetime.utcnow() - timedelta(days=7))
        task2 = ProductionTask(order_id=order1.order_id, machine_id=m2.machine_id, material_id=mat1.material_id, status="Completed", scheduled_at=datetime.utcnow() - timedelta(days=6), completed_at=datetime.utcnow() - timedelta(days=5))
        db.session.add_all([task1, task2])
        db.session.commit()

        # 6. Add Quality Reports
        qr1 = QualityReport(task_id=task2.task_id, inspector="Mike Foreman", result="Approved", report_date=datetime.utcnow() - timedelta(days=4))
        db.session.add(qr1)
        db.session.commit()

        # 7. Add Invoices (One paid, one pending for analytics)
        inv1 = Invoice(order_id=order1.order_id, amount=2500.00, issued_date=datetime.utcnow().date() - timedelta(days=3), paid=True)
        
        # Fake a second disconnected invoice just to give the Analytics dashboard some "Pending" data
        inv2 = Invoice(order_id=order1.order_id, amount=1200.50, issued_date=datetime.utcnow().date(), paid=False)
        
        db.session.add_all([inv1, inv2])
        db.session.commit()

        print("✅ Success! Database 'spring_plm.db' is now populated with fake data.")

if __name__ == '__main__':
    seed_database()

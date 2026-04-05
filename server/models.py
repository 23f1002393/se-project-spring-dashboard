from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


# Initialize the database with the Flask app
def init_app_db(app):
    db.init_app(app)


# --- MODELS ---


class Customer(db.Model):
    __tablename__ = "customers"
    customer_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(255))
    company_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))

    enquiries = db.relationship("Enquiry", backref="customer", lazy=True)


class Enquiry(db.Model):
    __tablename__ = "enquiries"
    enquiry_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.customer_id"))
    status = db.Column(db.String(50), default="New")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    quotations = db.relationship("Quotation", backref="enquiry", lazy=True)


class Quotation(db.Model):
    __tablename__ = "quotations"
    quote_id = db.Column(db.Integer, primary_key=True)
    enquiry_id = db.Column(db.Integer, db.ForeignKey("enquiries.enquiry_id"))
    version_number = db.Column(db.Integer, default=1)
    price = db.Column(db.Float)
    est_delivery = db.Column(db.Date)
    is_accepted = db.Column(db.Boolean, default=False)

    orders = db.relationship("Order", backref="quotation", lazy=True)


class SpringMaster(db.Model):
    __tablename__ = "spring_master"
    spring_id = db.Column(db.Integer, primary_key=True)
    part_number = db.Column(db.String(50), unique=True)
    wire_diameter = db.Column(db.Float)
    material_spec = db.Column(db.String(100))

    orders = db.relationship("Order", backref="spring", lazy=True)


class Order(db.Model):
    __tablename__ = "orders"
    order_id = db.Column(db.Integer, primary_key=True)
    quote_id = db.Column(db.Integer, db.ForeignKey("quotations.quote_id"))
    spring_id = db.Column(db.Integer, db.ForeignKey("spring_master.spring_id"))
    production_status = db.Column(db.String(50), default="Pending")

    tasks = db.relationship("ProductionTask", backref="order", lazy=True)
    invoices = db.relationship("Invoice", backref="order", lazy=True)
    shipments = db.relationship("Shipment", backref="order", lazy=True)


class Machine(db.Model):
    __tablename__ = "machines"
    machine_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    type = db.Column(db.String(50))
    status = db.Column(db.String(50))

    tasks = db.relationship("ProductionTask", backref="machine", lazy=True)


class Material(db.Model):
    __tablename__ = "materials"
    material_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    specification = db.Column(db.String(100))
    stock_quantity = db.Column(db.Float)

    tasks = db.relationship("ProductionTask", backref="material", lazy=True)


class ProductionTask(db.Model):
    __tablename__ = "production_tasks"
    task_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id"))
    machine_id = db.Column(db.Integer, db.ForeignKey("machines.machine_id"))
    material_id = db.Column(db.Integer, db.ForeignKey("materials.material_id"))
    status = db.Column(db.String(50), default="Scheduled")
    scheduled_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    quality_reports = db.relationship("QualityReport", backref="task", lazy=True)


class QualityReport(db.Model):
    __tablename__ = "quality_reports"
    report_id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("production_tasks.task_id"))
    inspector = db.Column(db.String(100))
    result = db.Column(db.String(50))
    report_date = db.Column(db.DateTime, default=datetime.utcnow)


class Invoice(db.Model):
    __tablename__ = "invoices"
    invoice_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id"))
    amount = db.Column(db.Float)
    issued_date = db.Column(db.Date)
    paid = db.Column(db.Boolean, default=False)


class Shipment(db.Model):
    __tablename__ = "shipments"
    shipment_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id"))
    shipped_date = db.Column(db.Date)
    carrier = db.Column(db.String(100))
    tracking_number = db.Column(db.String(100))

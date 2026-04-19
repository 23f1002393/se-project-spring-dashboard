import datetime as dt
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine,
    ForeignKey,
    String,
    Integer,
    Float,
    DateTime,
    Date,
    Boolean,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
    scoped_session,
)
from werkzeug.security import generate_password_hash, check_password_hash

# Define the engine and session objects at the module level
# They will be initialized in init_app_db
engine = None
db_session = scoped_session(sessionmaker())


class QueryProperty:
    def __get__(self, instance, owner):
        return db_session.query(owner)


class Base(DeclarativeBase):
    query = QueryProperty()


# Proxy object to maintain compatibility with existing 'db.session' and 'db.Model' calls
class db:
    session = db_session
    Model = Base

    @staticmethod
    def init_app(app):
        init_app_db(app)

    @staticmethod
    def create_all():
        if engine:
            Base.metadata.create_all(engine)

    @staticmethod
    def drop_all():
        if engine:
            Base.metadata.drop_all(engine)


# Initialize the database
def init_app_db(app):
    global engine
    database_uri = app.config.get(
        "SQLALCHEMY_DATABASE_URI", "sqlite:///spring_manufacturing.db"
    )
    engine = create_engine(database_uri)
    db_session.configure(bind=engine)

    # Create tables
    Base.metadata.create_all(engine)

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()


# --- MODELS ---


class User(Base):
    __tablename__ = "users"
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="customer")
    company_name: Mapped[str] = mapped_column(String(100), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    enquiries: Mapped[list["Enquiry"]] = relationship(
        "Enquiry", backref="customer", lazy=True
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "company_name": self.company_name,
            "phone": self.phone,
        }


class Enquiry(Base):
    __tablename__ = "enquiries"
    enquiry_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id"), nullable=True
    )
    product_spec: Mapped[str] = mapped_column(String(255), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="New")
    rejection_reason: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    quotations: Mapped[list["Quotation"]] = relationship(
        "Quotation", backref="enquiry", lazy=True
    )


class Quotation(Base):
    __tablename__ = "quotations"
    quote_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enquiry_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("enquiries.enquiry_id"), nullable=True
    )
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    price: Mapped[float] = mapped_column(Float, nullable=True)
    est_delivery: Mapped[dt.date] = mapped_column(Date, nullable=True)
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=False)

    orders: Mapped[list["Order"]] = relationship(
        "Order", backref="quotation", lazy=True
    )


class Spring(Base):
    __tablename__ = "springs"
    spring_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    part_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=True)
    wire_diameter: Mapped[float] = mapped_column(Float, nullable=True)
    material_spec: Mapped[str] = mapped_column(String(100), nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)

    orders: Mapped[list["Order"]] = relationship("Order", backref="spring", lazy=True)


class Order(Base):
    __tablename__ = "orders"
    order_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    quote_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("quotations.quote_id"), nullable=True
    )
    spring_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("springs.spring_id"), nullable=True
    )
    production_status: Mapped[str] = mapped_column(String(50), default="Pending")

    tasks: Mapped[list["ProductionTask"]] = relationship(
        "ProductionTask", backref="order", lazy=True
    )
    invoices: Mapped[list["Invoice"]] = relationship(
        "Invoice", backref="order", lazy=True
    )
    shipments: Mapped[list["Shipment"]] = relationship(
        "Shipment", backref="order", lazy=True
    )


class Machine(Base):
    __tablename__ = "machines"
    machine_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=True)
    maintenance_threshold: Mapped[int] = mapped_column(Integer, default=10000)
    maintenance_warning_threshold: Mapped[int] = mapped_column(Integer, default=8000)
    last_maintenance_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    tasks: Mapped[list["ProductionTask"]] = relationship(
        "ProductionTask", backref="machine", lazy=True
    )


class Material(Base):
    __tablename__ = "materials"
    material_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=True)
    specification: Mapped[str] = mapped_column(String(100), nullable=True)
    stock_quantity: Mapped[float] = mapped_column(Float, nullable=True)

    tasks: Mapped[list["ProductionTask"]] = relationship(
        "ProductionTask", backref="material", lazy=True
    )


class ProductionTask(Base):
    __tablename__ = "production_tasks"
    task_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.order_id"), nullable=True
    )
    machine_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("machines.machine_id"), nullable=True
    )
    material_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("materials.material_id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="Scheduled")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    estimated_springs_produced: Mapped[int] = mapped_column(Integer, default=0)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    quality_reports: Mapped[list["QualityReport"]] = relationship(
        "QualityReport", backref="task", lazy=True
    )


class QualityReport(Base):
    __tablename__ = "quality_reports"
    report_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("production_tasks.task_id"), nullable=True
    )
    inspector: Mapped[str] = mapped_column(String(100), nullable=True)
    result: Mapped[str] = mapped_column(String(50), nullable=True)
    rejection_reason: Mapped[str] = mapped_column(String(255), nullable=True)
    report_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"
    log_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(
        String(50), nullable=True
    )  # e.g., Quotation, Order, QC
    entity_id: Mapped[int] = mapped_column(Integer, nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id"), nullable=True
    )
    details: Mapped[str] = mapped_column(String(255), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Invoice(Base):
    __tablename__ = "invoices"
    invoice_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.order_id"), nullable=True
    )
    amount: Mapped[float] = mapped_column(Float, nullable=True)
    issued_date: Mapped[dt.date] = mapped_column(Date, nullable=True)
    paid: Mapped[bool] = mapped_column(Boolean, default=False)


class Shipment(Base):
    __tablename__ = "shipments"
    shipment_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.order_id"), nullable=True
    )
    shipped_date: Mapped[dt.date] = mapped_column(Date, nullable=True)
    carrier: Mapped[str] = mapped_column(String(100), nullable=True)
    tracking_number: Mapped[str] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Dispatch")
    customer_feedback: Mapped[str] = mapped_column(String(255), nullable=True)

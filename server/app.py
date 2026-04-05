from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api, Resource
from flasgger import Swagger
from datetime import datetime
from sqlalchemy import func

# Initialize App
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///spring_plm.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SWAGGER'] = {
    'title': 'Spring Manufacturing PLM API',
    'uiversion': 3
}

db = SQLAlchemy(app)
api = Api(app)
swagger = Swagger(app)

# --- MODELS ---

class Customer(db.Model):
    __tablename__ = 'customers'
    customer_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(255))
    company_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    
    enquiries = db.relationship('Enquiry', backref='customer', lazy=True)

class Enquiry(db.Model):
    __tablename__ = 'enquiries'
    enquiry_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.customer_id'))
    status = db.Column(db.String(50), default='New')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    quotations = db.relationship('Quotation', backref='enquiry', lazy=True)

class Quotation(db.Model):
    __tablename__ = 'quotations'
    quote_id = db.Column(db.Integer, primary_key=True)
    enquiry_id = db.Column(db.Integer, db.ForeignKey('enquiries.enquiry_id'))
    version_number = db.Column(db.Integer, default=1)
    price = db.Column(db.Float)
    est_delivery = db.Column(db.Date)
    is_accepted = db.Column(db.Boolean, default=False)

    orders = db.relationship('Order', backref='quotation', lazy=True)

class SpringMaster(db.Model):
    __tablename__ = 'spring_master'
    spring_id = db.Column(db.Integer, primary_key=True)
    part_number = db.Column(db.String(50), unique=True)
    wire_diameter = db.Column(db.Float)
    material_spec = db.Column(db.String(100))

    orders = db.relationship('Order', backref='spring', lazy=True)

class Order(db.Model):
    __tablename__ = 'orders'
    order_id = db.Column(db.Integer, primary_key=True)
    quote_id = db.Column(db.Integer, db.ForeignKey('quotations.quote_id'))
    spring_id = db.Column(db.Integer, db.ForeignKey('spring_master.spring_id'))
    production_status = db.Column(db.String(50), default='Pending')

    tasks = db.relationship('ProductionTask', backref='order', lazy=True)
    invoices = db.relationship('Invoice', backref='order', lazy=True)
    shipments = db.relationship('Shipment', backref='order', lazy=True)

class Machine(db.Model):
    __tablename__ = 'machines'
    machine_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    type = db.Column(db.String(50))
    status = db.Column(db.String(50))

    tasks = db.relationship('ProductionTask', backref='machine', lazy=True)

class Material(db.Model):
    __tablename__ = 'materials'
    material_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    specification = db.Column(db.String(100))
    stock_quantity = db.Column(db.Float)

    tasks = db.relationship('ProductionTask', backref='material', lazy=True)

class ProductionTask(db.Model):
    __tablename__ = 'production_tasks'
    task_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'))
    machine_id = db.Column(db.Integer, db.ForeignKey('machines.machine_id'))
    material_id = db.Column(db.Integer, db.ForeignKey('materials.material_id'))
    status = db.Column(db.String(50), default='Scheduled')
    scheduled_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    quality_reports = db.relationship('QualityReport', backref='task', lazy=True)

class QualityReport(db.Model):
    __tablename__ = 'quality_reports'
    report_id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('production_tasks.task_id'))
    inspector = db.Column(db.String(100))
    result = db.Column(db.String(50))
    report_date = db.Column(db.DateTime, default=datetime.utcnow)

class Invoice(db.Model):
    __tablename__ = 'invoices'
    invoice_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'))
    amount = db.Column(db.Float)
    issued_date = db.Column(db.Date)
    paid = db.Column(db.Boolean, default=False)

class Shipment(db.Model):
    __tablename__ = 'shipments'
    shipment_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'))
    shipped_date = db.Column(db.Date)
    carrier = db.Column(db.String(100))
    tracking_number = db.Column(db.String(100))


# Standered error function
def error_response(code, message, details=None):
    """Standardized error format for the API"""
    response = {
        "error": {
            "code": code,
            "message": message
        }
    }
    if details:
        response["error"]["details"] = details
    return response, code

# API endpoints

class CustomerListAPI(Resource):
    def get(self):
        """
        Retrieve a list of all customers
        ---
        tags:
          - Customers
        responses:
          200:
            description: A list of customers
            schema:
              type: array
              items:
                type: object
                properties:
                  customer_id:
                    type: integer
                  name:
                    type: string
                  company_name:
                    type: string
        """
        customers = Customer.query.all()
        return [
            {
                "customer_id": c.customer_id, 
                "name": c.name, 
                "company_name": c.company_name
            } for c in customers
        ], 200


#EPIC 1
class EnquiryAPI(Resource):
    def get(self):
        """
        Fetch all customer enquiries
        ---
        tags:
          - Enquiries
        responses:
          200:
            description: A list of all enquiries
            schema:
              type: array
              items:
                type: object
                properties:
                  enquiry_id:
                    type: integer
                  customer_id:
                    type: integer
                  status:
                    type: string
                  created_at:
                    type: string
        """
        enquiries = Enquiry.query.all()
        return [
            {
                "enquiry_id": e.enquiry_id,
                "customer_id": e.customer_id,
                "status": e.status,
                "created_at": e.created_at.strftime("%Y-%m-%d %H:%M:%S") if e.created_at else None
            } for e in enquiries
        ], 200

    def post(self):
        # ... (Keep your existing post method code here) ...
        data = request.get_json()
        if 'customer_id' not in data:
            return error_response(400, "customer_id is required")
        customer = Customer.query.get(data['customer_id'])
        if not customer:
            return error_response(404, f"Customer with ID {data['customer_id']} not found.")
        new_enquiry = Enquiry(customer_id=data['customer_id'])
        db.session.add(new_enquiry)
        db.session.commit()
        return {
            "message": "Enquiry created successfully", 
            "enquiry_id": new_enquiry.enquiry_id,
            "status": new_enquiry.status
        }, 201

class EnquiryDetailAPI(Resource):
    def get(self, enquiry_id):
        """
        Fetch details of a specific enquiry by ID
        ---
        tags:
          - Enquiries
        parameters:
          - name: enquiry_id
            in: path
            type: integer
            required: true
        responses:
          200:
            description: Detailed enquiry information
          404:
            description: Enquiry not found
        """
        enquiry = Enquiry.query.get(enquiry_id)
        if not enquiry:
            return error_response(404, f"Enquiry ID {enquiry_id} not found.")
            
        return {
            "enquiry_id": enquiry.enquiry_id,
            "customer_id": enquiry.customer_id,
            "status": enquiry.status,
            "created_at": enquiry.created_at.strftime("%Y-%m-%d %H:%M:%S") if enquiry.created_at else None
        }, 200



class QuotationAPI(Resource):
    def get(self, enquiry_id):
        """
        Fetch all quotations for a specific enquiry
        ---
        tags:
          - Quotations
        parameters:
          - name: enquiry_id
            in: path
            type: integer
            required: true
        responses:
          200:
            description: A list of quotations linked to the enquiry
          404:
            description: Enquiry not found
        """
        enquiry = Enquiry.query.get(enquiry_id)
        if not enquiry:
            return error_response(404, f"Enquiry ID {enquiry_id} not found.")
            
        quotations = Quotation.query.filter_by(enquiry_id=enquiry_id).all()
        
        return [
            {
                "quote_id": q.quote_id,
                "version_number": q.version_number,
                "price": q.price,
                "est_delivery": q.est_delivery.strftime("%Y-%m-%d") if q.est_delivery else None,
                "is_accepted": q.is_accepted
            } for q in quotations
        ], 200

    def post(self, enquiry_id):
        # ... (Keep your existing post method code here) ...
        enquiry = Enquiry.query.get(enquiry_id)
        if not enquiry:
            return error_response(404, f"Enquiry ID {enquiry_id} not found.")
        data = request.get_json()
        try:
            est_delivery_date = datetime.strptime(data['est_delivery'], "%Y-%m-%d").date()
        except ValueError:
            return error_response(400, "Invalid date format. Use YYYY-MM-DD.")
        new_quote = Quotation(
            enquiry_id=enquiry_id,
            version_number=1,
            price=data['price'],
            est_delivery=est_delivery_date
        )
        enquiry.status = "Quoted"
        db.session.add(new_quote)
        db.session.commit()
        return {"message": "Quotation generated", "quote_id": new_quote.quote_id}, 201

class QuotationReviseAPI(Resource):
    def post(self, quote_id):
        """
        Revise quotation terms with version control (User Story 1.4)
        ---
        tags:
          - Quotations
        parameters:
          - name: quote_id
            in: path
            type: integer
            required: true
            description: The ID of the existing quotation to revise
          - in: body
            name: body
            required: true
            schema:
              type: object
              properties:
                price:
                  type: number
                  format: float
                  example: 1400.00
                est_delivery:
                  type: string
                  format: date
                  example: "2026-04-25"
        responses:
          201:
            description: New quotation version created
          404:
            description: Original quotation not found
        """
        old_quote = Quotation.query.get(quote_id)
        if not old_quote:
            return error_response(404, f"Quotation ID {quote_id} not found.")
            
        data = request.get_json()
        
        est_delivery_date = old_quote.est_delivery
        if 'est_delivery' in data:
            est_delivery_date = datetime.strptime(data['est_delivery'], "%Y-%m-%d").date()
            
        # Create new version based on old quote
        new_quote = Quotation(
            enquiry_id=old_quote.enquiry_id,
            version_number=old_quote.version_number + 1, # Increment version
            price=data.get('price', old_quote.price),
            est_delivery=est_delivery_date
        )
        
        db.session.add(new_quote)
        db.session.commit()
        
        return {
            "message": f"Quotation revised to version {new_quote.version_number}",
            "new_quote_id": new_quote.quote_id
        }, 201

class QuotationAcceptAPI(Resource):
    def post(self, quote_id):
        """
        Convert an accepted quotation into a confirmed production order (User Story 1.5)
        ---
        tags:
          - Quotations
          - Orders
        parameters:
          - name: quote_id
            in: path
            type: integer
            required: true
            description: The ID of the accepted quotation
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - spring_id
              properties:
                spring_id:
                  type: integer
                  example: 1
                  description: The ID of the Spring Master component being ordered
        responses:
          201:
            description: Order created successfully
          400:
            description: Quotation already accepted
          404:
            description: Quotation or Spring not found
        """
        quote = Quotation.query.get(quote_id)
        if not quote:
            return error_response(404, f"Quotation ID {quote_id} not found.")
            
        if quote.is_accepted:
            return error_response(400, "This quotation has already been accepted.")
            
        data = request.get_json()
        spring_id = data.get('spring_id')
        
        # Update quote status
        quote.is_accepted = True
        
        # Update enquiry status
        enquiry = Enquiry.query.get(quote.enquiry_id)
        enquiry.status = "Order Confirmed"
        
        # Create Production Order
        new_order = Order(
            quote_id=quote.quote_id,
            spring_id=spring_id,
            production_status="Pending Planning" # Bridges into Epic 2
        )
        
        db.session.add(new_order)
        db.session.commit()
        
        return {
            "message": "Quotation accepted and Order confirmed",
            "order_id": new_order.order_id
        }, 201


#epic 2

class MaterialListAPI(Resource):
    def get(self):
        """
        Check raw material inventory (User Story 2.1)
        ---
        tags:
          - Production Planning (Epic 2)
        responses:
          200:
            description: List of available materials and stock quantities
            schema:
              type: array
              items:
                type: object
                properties:
                  material_id:
                    type: integer
                  name:
                    type: string
                  stock_quantity:
                    type: number
        """
        materials = Material.query.all()
        return [
            {
                "material_id": m.material_id, 
                "name": m.name, 
                "specification": m.specification,
                "stock_quantity": m.stock_quantity
            } for m in materials
        ], 200

class MachineListAPI(Resource):
    def get(self):
        """
        View machine status and capacity (User Story 2.3)
        ---
        tags:
          - Production Planning (Epic 2)
        responses:
          200:
            description: List of all machines and their current status
        """
        machines = Machine.query.all()
        return [
            {
                "machine_id": m.machine_id, 
                "name": m.name, 
                "type": m.type, 
                "status": m.status
            } for m in machines
        ], 200



class ProductionTaskAPI(Resource):
    def post(self):
        """
        Schedule a production task and reserve materials (User Stories 2.1, 2.4)
        ---
        tags:
          - Production Planning (Epic 2)
        parameters:
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - order_id
                - machine_id
                - material_id
                - scheduled_at
                - material_required
              properties:
                order_id:
                  type: integer
                machine_id:
                  type: integer
                material_id:
                  type: integer
                scheduled_at:
                  type: string
                  format: date-time
                  example: "2026-04-10T08:00:00"
                material_required:
                  type: number
                  description: Amount of material to reserve/deduct
        responses:
          201:
            description: Task scheduled successfully
          400:
            description: Insufficient material or invalid input
          404:
            description: Resource not found
        """
        data = request.get_json()
        
        # 1. Check material availability
        material = Material.query.get(data['material_id'])
        if not material:
            return error_response(404, "Material not found")
            
        required_qty = data.get('material_required', 0)
        if material.stock_quantity < required_qty:
            return error_response(400, f"Insufficient stock. Only {material.stock_quantity} available.")
            
        # 2. Parse Date
        try:
            scheduled_date = datetime.strptime(data['scheduled_at'], "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            return error_response(400, "Invalid date format. Use YYYY-MM-DDTHH:MM:SS")
            
        # 3. Create Task & Deduct Material (Reservation)
        new_task = ProductionTask(
            order_id=data['order_id'],
            machine_id=data['machine_id'],
            material_id=data['material_id'],
            status="Scheduled",
            scheduled_at=scheduled_date
        )
        
        material.stock_quantity -= required_qty # Deduct stock
        
        # Update Order Status
        order = Order.query.get(data['order_id'])
        if order:
            order.production_status = "In Production"
            
        db.session.add(new_task)
        db.session.commit()
        
        return {"message": "Production task scheduled and materials reserved", "task_id": new_task.task_id}, 201

class TaskStatusUpdateAPI(Resource):
    def put(self, task_id):
        """
        Track current production stage (User Story 3.3)
        ---
        tags:
          - Production Execution (Epic 3)
        parameters:
          - name: task_id
            in: path
            type: integer
            required: true
          - in: body
            name: body
            required: true
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: "In Progress" # e.g., Scheduled, In Progress, Completed
        responses:
          200:
            description: Task status updated
        """
        task = ProductionTask.query.get(task_id)
        if not task:
            return error_response(404, f"Task ID {task_id} not found")
            
        data = request.get_json()
        new_status = data.get('status')
        
        task.status = new_status
        if new_status == "Completed":
            task.completed_at = datetime.utcnow()
            
        db.session.commit()
        return {"message": f"Task status updated to {new_status}"}, 200
class QualityReportAPI(Resource):
    def post(self, task_id):
        """
        Record inspection results (User Stories 3.4, 3.5)
        ---
        tags:
          - Production Execution (Epic 3)
        parameters:
          - name: task_id
            in: path
            type: integer
            required: true
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - inspector
                - result
              properties:
                inspector:
                  type: string
                  example: "John Doe"
                result:
                  type: string
                  example: "Approved" # Approved or Rejected
        responses:
          201:
            description: Quality report saved
        """
        task = ProductionTask.query.get(task_id)
        if not task:
            return error_response(404, "Task not found")
            
        data = request.get_json()
        
        report = QualityReport(
            task_id=task_id,
            inspector=data['inspector'],
            result=data['result']
        )
        
        db.session.add(report)
        
        # If approved, update order status to ready for invoicing
        if data['result'] == "Approved":
            order = Order.query.get(task.order_id)
            if order:
                order.production_status = "Quality Approved - Ready for Billing"
                
        db.session.commit()
        
        return {"message": f"Quality report recorded: {data['result']}", "report_id": report.report_id}, 201


#epic 4

class InvoiceAPI(Resource):
    def post(self, order_id):
        """
        Generate an invoice for a completed order (User Stories 4.1, 4.2)
        ---
        tags:
          - Invoicing (Epic 4)
        parameters:
          - name: order_id
            in: path
            type: integer
            required: true
          - in: body
            name: body
            required: false
            schema:
              type: object
              properties:
                manual_amount:
                  type: number
                  format: float
                  description: Optional manual override for custom pricing (US 4.2)
        responses:
          201:
            description: Invoice generated successfully
          400:
            description: Order not ready for invoicing
          404:
            description: Order not found
        """
        order = Order.query.get(order_id)
        if not order:
            return error_response(404, f"Order ID {order_id} not found")
            
        # Business Logic: Only invoice if Quality Control passed
        if order.production_status != "Quality Approved - Ready for Billing":
            return error_response(400, "Cannot generate invoice. Order has not passed Quality Control.")
            
        data = request.get_json() or {}
        
        # Determine amount: Manual override (Custom spring) OR fetch from Quotation
        amount = data.get('manual_amount')
        if not amount:
            quote = Quotation.query.get(order.quote_id)
            amount = quote.price if quote else 0.0

        new_invoice = Invoice(
            order_id=order_id,
            amount=amount,
            issued_date=datetime.utcnow().date(),
            paid=False
        )
        
        # Update order status
        order.production_status = "Invoiced - Pending Dispatch"
        
        db.session.add(new_invoice)
        db.session.commit()
        
        return {
            "message": "Invoice generated successfully", 
            "invoice_id": new_invoice.invoice_id,
            "amount": new_invoice.amount
        }, 201

class InvoicePaymentAPI(Resource):
    def put(self, invoice_id):
        """
        Mark an invoice as paid
        ---
        tags:
          - Invoicing (Epic 4)
        parameters:
          - name: invoice_id
            in: path
            type: integer
            required: true
        responses:
          200:
            description: Invoice marked as paid
        """
        invoice = Invoice.query.get(invoice_id)
        if not invoice:
            return error_response(404, "Invoice not found")
            
        invoice.paid = True
        db.session.commit()
        
        return {"message": "Invoice successfully marked as paid"}, 200


class ShipmentDispatchAPI(Resource):
    def post(self, order_id):
        """
        Dispatch an order and generate tracking details (User Story 5.1)
        ---
        tags:
          - Delivery Status (Epic 5)
        parameters:
          - name: order_id
            in: path
            type: integer
            required: true
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - carrier
                - tracking_number
              properties:
                carrier:
                  type: string
                  example: "FedEx Freight"
                tracking_number:
                  type: string
                  example: "TRK-987654321"
        responses:
          201:
            description: Shipment dispatched successfully
        """
        order = Order.query.get(order_id)
        if not order:
            return error_response(404, "Order not found")
            
        if "Invoiced" not in order.production_status:
            return error_response(400, "Order must be invoiced before dispatching")

        data = request.get_json()
        
        new_shipment = Shipment(
            order_id=order_id,
            shipped_date=datetime.utcnow().date(),
            carrier=data['carrier'],
            tracking_number=data['tracking_number']
        )
        
        # Update order status
        order.production_status = "Dispatched - In Transit"
        
        db.session.add(new_shipment)
        db.session.commit()
        
        return {
            "message": "Order dispatched", 
            "shipment_id": new_shipment.shipment_id
        }, 201

class ShipmentDeliveryAPI(Resource):
    def put(self, shipment_id):
        """
        Record final delivery acceptance or rejection (User Stories 5.1, 5.2)
        ---
        tags:
          - Delivery Status (Epic 5)
        parameters:
          - name: shipment_id
            in: path
            type: integer
            required: true
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - delivery_status
              properties:
                delivery_status:
                  type: string
                  example: "Delivered & Accepted" # Or "Rejected"
                rejection_reason:
                  type: string
                  description: Required if delivery_status is Rejected
                  example: "Springs failed load test at customer site"
        responses:
          200:
            description: Delivery status updated
        """
        shipment = Shipment.query.get(shipment_id)
        if not shipment:
            return error_response(404, "Shipment not found")
            
        order = Order.query.get(shipment.order_id)
        data = request.get_json()
        
        status = data.get('delivery_status')
        
        if status == "Rejected":
            reason = data.get('rejection_reason', 'No reason provided')
            # Storing the rejection reason in the order status for traceability
            order.production_status = f"Rejected by Customer - Reason: {reason}"
        else:
            order.production_status = "Delivered & Accepted - Closed"
            
        db.session.commit()
        
        return {"message": f"Delivery updated: {status}"}, 200


#epic 5 and 6

class FinancialAnalyticsAPI(Resource):
    def get(self):
        """
        Get financial metrics for dashboards (User Story 6.1, 6.3)
        ---
        tags:
          - Analytics (Epic 6)
        responses:
          200:
            description: Financial metrics including sales and pending revenue
            schema:
              type: object
              properties:
                total_revenue:
                  type: number
                  description: Sum of all invoices
                collected_revenue:
                  type: number
                  description: Sum of paid invoices
                pending_revenue:
                  type: number
                  description: Sum of unpaid invoices
        """
        # Calculate total revenue generated
        total_rev = db.session.query(func.sum(Invoice.amount)).scalar() or 0.0
        
        # Calculate revenue actually collected (paid = True)
        collected_rev = db.session.query(func.sum(Invoice.amount)).filter(Invoice.paid == True).scalar() or 0.0
        
        # Calculate pending revenue (paid = False)
        pending_rev = total_rev - collected_rev
        
        # Note: In a full system, 'Cost' would be calculated by multiplying Material Used * Material Cost.
        # For this milestone, we are returning the primary revenue data ready for frontend Pie/Bar charts.

        return {
            "metrics": {
                "total_revenue": round(total_rev, 2),
                "collected_revenue": round(collected_rev, 2),
                "pending_revenue": round(pending_rev, 2)
            },
            "chart_data": {
                "labels": ["Collected Revenue", "Pending Revenue"],
                "series": [round(collected_rev, 2), round(pending_rev, 2)]
            }
        }, 200

class ProductionAnalyticsAPI(Resource):
    def get(self):
        """
        Get machine utilization and production efficiency (User Story 6.2, 6.3)
        ---
        tags:
          - Analytics (Epic 6)
        responses:
          200:
            description: Production metrics by machine
        """
        # Get count of tasks per machine to show utilization
        utilization_query = db.session.query(
            Machine.name, 
            func.count(ProductionTask.task_id).label('task_count')
        ).join(ProductionTask, Machine.machine_id == ProductionTask.machine_id)\
         .group_by(Machine.name).all()

        machine_labels = []
        task_counts = []
        
        for row in utilization_query:
            machine_labels.append(row.name)
            task_counts.append(row.task_count)

        # Calculate overall order status distribution
        status_query = db.session.query(
            Order.production_status,
            func.count(Order.order_id).label('count')
        ).group_by(Order.production_status).all()

        pipeline_status = {row.production_status: row.count for row in status_query}

        return {
            "machine_utilization": {
                "chart_type": "bar",
                "labels": machine_labels,
                "data": task_counts
            },
            "production_pipeline": {
                "chart_type": "pie",
                "data": pipeline_status
            }
        }, 200



# customer info
api.add_resource(CustomerListAPI, '/api/v1/customers')


# Epic 1 Route Registration
api.add_resource(EnquiryAPI, '/api/v1/enquiries')
api.add_resource(EnquiryDetailAPI, '/api/v1/enquiries/<int:enquiry_id>')
api.add_resource(QuotationAPI, '/api/v1/enquiries/<int:enquiry_id>/quotations')
api.add_resource(QuotationReviseAPI, '/api/v1/quotations/<int:quote_id>/revise')
api.add_resource(QuotationAcceptAPI, '/api/v1/quotations/<int:quote_id>/accept')

# Epic 2 Route Registration
api.add_resource(MaterialListAPI, '/api/v1/materials')
api.add_resource(MachineListAPI, '/api/v1/machines')
api.add_resource(ProductionTaskAPI, '/api/v1/tasks')

# Epic 3 Route Registration
api.add_resource(TaskStatusUpdateAPI, '/api/v1/tasks/<int:task_id>/status')
api.add_resource(QualityReportAPI, '/api/v1/tasks/<int:task_id>/quality')

# Epic 4 Route Registration
api.add_resource(InvoiceAPI, '/api/v1/orders/<int:order_id>/invoice')
api.add_resource(InvoicePaymentAPI, '/api/v1/invoices/<int:invoice_id>/pay')

# Epic 5 Route Registration
api.add_resource(ShipmentDispatchAPI, '/api/v1/orders/<int:order_id>/shipment')
api.add_resource(ShipmentDeliveryAPI, '/api/v1/shipments/<int:shipment_id>/delivery')
# Epic 6 Route Registration
api.add_resource(FinancialAnalyticsAPI, '/api/v1/analytics/financials')
api.add_resource(ProductionAnalyticsAPI, '/api/v1/analytics/production')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)



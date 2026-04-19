from flask import request
from flask_restful import Resource

from datetime import datetime, timezone
from utils import error_response
from models import ProductionTask, Material, QualityReport, Order, db


class ProductionTaskAPI(Resource):
    def get(self):
        """
        Fetch all production tasks
        ---
        tags:
          - Production Planning (Epic 2)
        responses:
          200:
            description: A list of all tasks
        """
        tasks = ProductionTask.query.all()
        return [
            {
                "id": t.task_id,
                "order_id": t.order_id,
                "machine_id": t.machine_id,
                "machine_name": t.machine.name if t.machine else None,
                "status": t.status,
                "progress": t.progress,
                "estimated_springs_produced": t.estimated_springs_produced,
            }
            for t in tasks
        ], 200

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
                estimated_springs_produced:
                  type: integer
                  description: Expected number of springs this task will produce, used for maintenance planning
                  example: 2500
        responses:
          201:
            description: Task scheduled successfully
          400:
            description: Insufficient material or invalid input
          404:
            description: Resource not found
        """
        data = request.get_json()
        order_id = data.get("order_id")
        order = db.session.get(Order, order_id)
        if not order:
            return error_response(404, "Order not found")

        # 1. Check Finished Goods Inventory (User Story 2.4 / 3.2.4)
        from models import Spring
        spring = db.session.get(Spring, order.spring_id)
        if spring and spring.stock_quantity > 0:
            # If we have stock, we could potentially fulfill from stock.
            # For simplicity, we just log that we checked it.
            # In a more complex system, we might prompt to use stock.
            pass

        # 2. Check material availability
        material = db.session.get(Material, data["material_id"])
        if not material:
            return error_response(404, "Material not found")

        required_qty = data.get("material_required", 0)
        if material.stock_quantity < required_qty:
            return error_response(
                400, f"Insufficient stock. Only {material.stock_quantity} available."
            )

        # 2. Parse Date
        try:
            scheduled_date = datetime.strptime(
                data["scheduled_at"], "%Y-%m-%dT%H:%M:%S"
            )
        except ValueError:
            return error_response(400, "Invalid date format. Use YYYY-MM-DDTHH:MM:SS")

        # 3. Create Task & Deduct Material (Reservation)
        new_task = ProductionTask(
            order_id=data["order_id"],
            machine_id=data["machine_id"],
            material_id=data["material_id"],
            status="Scheduled",
            estimated_springs_produced=data.get("estimated_springs_produced", 0),
            scheduled_at=scheduled_date,
        )

        material.stock_quantity -= required_qty  # Deduct stock

        # Update Order Status
        order = db.session.get(Order, data["order_id"])
        if order:
            order.production_status = "In Production"

        db.session.add(new_task)
        db.session.commit()

        return {
            "message": "Production task scheduled and materials reserved",
            "task_id": new_task.task_id,
        }, 201


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
        task = db.session.get(ProductionTask, task_id)
        if not task:
            return error_response(404, f"Task ID {task_id} not found")

        data = request.get_json()
        new_status = data.get("status")

        task.status = new_status
        if new_status == "Completed":
            task.completed_at = datetime.now(timezone.utc)

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
                rejection_reason:
                  type: string
                  example: "Spring length exceeds tolerance"
        responses:
          201:
            description: Quality report saved
        """
        task = db.session.get(ProductionTask, task_id)
        if not task:
            return error_response(404, "Task not found")

        data = request.get_json()

        report = QualityReport(
            task_id=task_id,
            inspector=data["inspector"],
            result=data["result"],
            rejection_reason=data.get("rejection_reason"),
        )

        db.session.add(report)

        # Update task status based on QC result
        if data["result"] == "Approved":
            task.status = "QC Passed"
        else:
            task.status = "QC Failed"

        from utils import log_audit
        log_audit(
            entity_type="QualityReport",
            entity_id=report.report_id,
            action=data["result"],
            details=f"Task {task_id} {data['result']} by {data['inspector']}. Reason: {data.get('rejection_reason')}"
        )

        # If approved, update order status to ready for invoicing and auto-generate invoice
        if data["result"] == "Approved":
            order = db.session.get(Order, task.order_id)
            if order:
                order.production_status = "Quality Approved - Ready for Billing"
                
                # Auto-generate Invoice (User Story 3.2.8)
                from models import Invoice, Quotation
                from datetime import timezone
                
                # Get price from quotation
                quote = db.session.get(Quotation, order.quote_id)
                amount = quote.price if quote else 0.0
                
                new_invoice = Invoice(
                    order_id=order.order_id,
                    amount=amount,
                    issued_date=datetime.now(timezone.utc).date(),
                    paid=False
                )
                db.session.add(new_invoice)
                order.production_status = "Invoiced - Pending Dispatch"
                
                log_audit(
                    entity_type="Invoice",
                    entity_id=new_invoice.invoice_id,
                    action="Auto-Generated",
                    details=f"Invoice for order {order.order_id} generated after QC approval"
                )

        elif data["result"] == "Rejected":
            order = db.session.get(Order, task.order_id)
            if order:
                order.production_status = "Failed QC - Rework Required"

        db.session.commit()

        return {
            "message": f"Quality report recorded: {data['result']}",
            "report_id": report.report_id,
        }, 201

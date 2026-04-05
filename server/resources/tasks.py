from flask import request
from flask_restful import Resource

from datetime import datetime
from utils import error_response
from models import ProductionTask, Material, QualityReport, Order, db


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
        material = Material.query.get(data["material_id"])
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
            scheduled_at=scheduled_date,
        )

        material.stock_quantity -= required_qty  # Deduct stock

        # Update Order Status
        order = Order.query.get(data["order_id"])
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
        task = ProductionTask.query.get(task_id)
        if not task:
            return error_response(404, f"Task ID {task_id} not found")

        data = request.get_json()
        new_status = data.get("status")

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
            task_id=task_id, inspector=data["inspector"], result=data["result"]
        )

        db.session.add(report)

        # If approved, update order status to ready for invoicing
        if data["result"] == "Approved":
            order = Order.query.get(task.order_id)
            if order:
                order.production_status = "Quality Approved - Ready for Billing"

        db.session.commit()

        return {
            "message": f"Quality report recorded: {data['result']}",
            "report_id": report.report_id,
        }, 201

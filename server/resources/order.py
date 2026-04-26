from flask import request
from flask_restful import Resource
from models import Order, Quotation, Spring, db
from utils import error_response

class OrderListAPI(Resource):
    def get(self):
        """
        Fetch all production orders (User Story 1.5, 3.2.3)
        ---
        tags:
          - Orders
        responses:
          200:
            description: A list of all orders
        """
        orders = Order.query.all()
        return [
            {
                "order_id": o.order_id,
                "quote_id": o.quote_id,
                "spring_id": o.spring_id,
                "production_status": o.production_status
            }
            for o in orders
        ], 200

    def post(self):
        """
        Create a new production order
        ---
        tags:
          - Orders
        parameters:
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - quote_id
                - spring_id
              properties:
                quote_id:
                  type: integer
                spring_id:
                  type: integer
                production_status:
                  type: string
        responses:
          201:
            description: Order created successfully
          400:
            description: Invalid payload
          404:
            description: Related entity not found
        """
        data = request.get_json() or {}
        quote_id = data.get("quote_id")
        spring_id = data.get("spring_id")

        if quote_id is None:
            return error_response(400, "quote_id is required")
        if spring_id is None:
            return error_response(400, "spring_id is required")

        quote = db.session.get(Quotation, quote_id)
        if not quote:
            return error_response(404, f"Quotation ID {quote_id} not found.")

        spring = db.session.get(Spring, spring_id)
        if not spring:
            return error_response(404, f"Spring ID {spring_id} not found.")

        new_order = Order(
            quote_id=quote_id,
            spring_id=spring_id,
            production_status=data.get("production_status", "Pending"),
        )
        db.session.add(new_order)
        db.session.commit()

        return {
            "message": "Order created successfully",
            "order_id": new_order.order_id,
            "quote_id": new_order.quote_id,
            "spring_id": new_order.spring_id,
            "production_status": new_order.production_status,
        }, 201

class OrderDetailAPI(Resource):
    def get(self, order_id):
        """
        Fetch a specific order's details
        ---
        tags:
          - Orders
        parameters:
          - name: order_id
            in: path
            type: integer
            required: true
        responses:
          200:
            description: Order details
          404:
            description: Order not found
        """
        order = db.session.get(Order, order_id)
        if not order:
            return error_response(404, "Order not found")
            
        return {
            "order_id": order.order_id,
            "quote_id": order.quote_id,
            "spring_id": order.spring_id,
            "production_status": order.production_status,
            "tasks": [
                {
                    "task_id": t.task_id,
                    "status": t.status,
                    "progress": t.progress
                }
                for t in order.tasks
            ]
        }, 200

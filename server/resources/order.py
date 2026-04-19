from flask_restful import Resource
from models import Order, db
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

from flask import request
from flask_restful import Resource

from datetime import datetime
from utils import error_response
from models import Order, Shipment, db


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
            carrier=data["carrier"],
            tracking_number=data["tracking_number"],
        )

        # Update order status
        order.production_status = "Dispatched - In Transit"

        db.session.add(new_shipment)
        db.session.commit()

        return {
            "message": "Order dispatched",
            "shipment_id": new_shipment.shipment_id,
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

        status = data.get("delivery_status")

        if status == "Rejected":
            reason = data.get("rejection_reason", "No reason provided")
            # Storing the rejection reason in the order status for traceability
            order.production_status = f"Rejected by Customer - Reason: {reason}"
        else:
            order.production_status = "Delivered & Accepted - Closed"

        db.session.commit()

        return {"message": f"Delivery updated: {status}"}, 200

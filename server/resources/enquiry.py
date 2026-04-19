from flask import request
from flask_restful import Resource

from utils import error_response
from models import Enquiry, User, db


# EPIC 1
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
                "id": e.enquiry_id,
                "customer_id": e.customer_id,
                "product_spec": e.product_spec,
                "quantity": e.quantity,
                "status": e.status,
                "rejection_reason": e.rejection_reason,
                "created_at": e.created_at.strftime("%Y-%m-%d %H:%M:%S")
                if e.created_at
                else None,
            }
            for e in enquiries
        ], 200

    def post(self):
        data = request.get_json()
        if "customer_id" not in data:
            return error_response(400, "customer_id is required")
        customer = db.session.get(User, data["customer_id"])
        if not customer:
            return error_response(
                404, f"Customer with ID {data['customer_id']} not found."
            )
        new_enquiry = Enquiry(
            customer_id=data["customer_id"],
            product_spec=data.get("product_spec"),
            quantity=data.get("quantity"),
        )
        db.session.add(new_enquiry)
        db.session.commit()
        return {
            "message": "Enquiry created successfully",
            "enquiry_id": new_enquiry.enquiry_id,
            "status": new_enquiry.status,
        }, 201


class EnquiryDetailAPI(Resource):
    def get(self, enquiry_id):
        enquiry = db.session.get(Enquiry, enquiry_id)
        if not enquiry:
            return error_response(404, f"Enquiry ID {enquiry_id} not found.")

        return {
            "enquiry_id": enquiry.enquiry_id,
            "customer_id": enquiry.customer_id,
            "status": enquiry.status,
            "rejection_reason": enquiry.rejection_reason,
            "created_at": enquiry.created_at.strftime("%Y-%m-%d %H:%M:%S")
            if enquiry.created_at
            else None,
        }, 200

    def put(self, enquiry_id):
        """
        Update an enquiry's status or details
        ---
        tags:
          - Enquiries
        parameters:
          - name: enquiry_id
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
                product_spec:
                  type: string
                quantity:
                  type: integer
        responses:
          200:
            description: Enquiry updated successfully
          404:
            description: Enquiry not found
        """
        enquiry = db.session.get(Enquiry, enquiry_id)
        if not enquiry:
            return error_response(404, f"Enquiry ID {enquiry_id} not found.")

        data = request.get_json()
        if "status" in data:
            enquiry.status = data["status"]
        if "product_spec" in data:
            enquiry.product_spec = data["product_spec"]
        if "quantity" in data:
            enquiry.quantity = data["quantity"]
        if "rejection_reason" in data:
            enquiry.rejection_reason = data["rejection_reason"]

        db.session.commit()
        return {"message": "Enquiry updated successfully"}, 200

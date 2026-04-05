from flask import request
from flask_restful import Resource

from utils import error_response
from models import Enquiry, Customer, db


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
                "enquiry_id": e.enquiry_id,
                "customer_id": e.customer_id,
                "status": e.status,
                "created_at": e.created_at.strftime("%Y-%m-%d %H:%M:%S")
                if e.created_at
                else None,
            }
            for e in enquiries
        ], 200

    def post(self):
        # ... (Keep your existing post method code here) ...
        data = request.get_json()
        if "customer_id" not in data:
            return error_response(400, "customer_id is required")
        customer = Customer.query.get(data["customer_id"])
        if not customer:
            return error_response(
                404, f"Customer with ID {data['customer_id']} not found."
            )
        new_enquiry = Enquiry(customer_id=data["customer_id"])
        db.session.add(new_enquiry)
        db.session.commit()
        return {
            "message": "Enquiry created successfully",
            "enquiry_id": new_enquiry.enquiry_id,
            "status": new_enquiry.status,
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
            "created_at": enquiry.created_at.strftime("%Y-%m-%d %H:%M:%S")
            if enquiry.created_at
            else None,
        }, 200

from flask_restful import Resource
from models import Enquiry, Quotation, Order, db
from utils import error_response
from flask import request
from datetime import datetime


# epic 2
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
                "est_delivery": q.est_delivery.strftime("%Y-%m-%d")
                if q.est_delivery
                else None,
                "is_accepted": q.is_accepted,
            }
            for q in quotations
        ], 200

    def post(self, enquiry_id):
        # ... (Keep your existing post method code here) ...
        enquiry = Enquiry.query.get(enquiry_id)
        if not enquiry:
            return error_response(404, f"Enquiry ID {enquiry_id} not found.")
        data = request.get_json()
        try:
            est_delivery_date = datetime.strptime(
                data["est_delivery"], "%Y-%m-%d"
            ).date()
        except ValueError:
            return error_response(400, "Invalid date format. Use YYYY-MM-DD.")
        new_quote = Quotation(
            enquiry_id=enquiry_id,
            version_number=1,
            price=data["price"],
            est_delivery=est_delivery_date,
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
        if "est_delivery" in data:
            est_delivery_date = datetime.strptime(
                data["est_delivery"], "%Y-%m-%d"
            ).date()

        # Create new version based on old quote
        new_quote = Quotation(
            enquiry_id=old_quote.enquiry_id,
            version_number=old_quote.version_number + 1,  # Increment version
            price=data.get("price", old_quote.price),
            est_delivery=est_delivery_date,
        )

        db.session.add(new_quote)
        db.session.commit()

        return {
            "message": f"Quotation revised to version {new_quote.version_number}",
            "new_quote_id": new_quote.quote_id,
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
        spring_id = data.get("spring_id")

        # Update quote status
        quote.is_accepted = True

        # Update enquiry status
        enquiry = Enquiry.query.get(quote.enquiry_id)
        enquiry.status = "Order Confirmed"

        # Create Production Order
        new_order = Order(
            quote_id=quote.quote_id,
            spring_id=spring_id,
            production_status="Pending Planning",  # Bridges into Epic 2
        )

        db.session.add(new_order)
        db.session.commit()

        return {
            "message": "Quotation accepted and Order confirmed",
            "order_id": new_order.order_id,
        }, 201

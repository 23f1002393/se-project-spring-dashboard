from flask_restful import Resource
from flask import request
from models import Order, Invoice, Quotation, db
from datetime import datetime, timezone
from utils import error_response


# EPIC 4
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
        order = db.session.get(Order, order_id)
        if not order:
            return error_response(404, f"Order ID {order_id} not found")

        # Business Logic: Only invoice if Quality Control passed
        if order.production_status != "Quality Approved - Ready for Billing":
            return error_response(
                400, "Cannot generate invoice. Order has not passed Quality Control."
            )

        data = request.get_json() or {}

        # Determine amount: Manual override (Custom spring) OR fetch from Quotation
        amount = data.get("manual_amount")
        if not amount:
            quote = db.session.get(Quotation, order.quote_id)
            amount = quote.price if quote else 0.0
        else:
            from utils import log_audit
            log_audit(
                entity_type="Invoice",
                entity_id=None, # will update after creation
                action="Pricing Override",
                details=f"Manual amount {amount} applied to order {order_id}"
            )

        new_invoice = Invoice(
            order_id=order_id,
            amount=amount,
            issued_date=datetime.now(timezone.utc).date(),
            paid=False,
        )

        # Update order status
        order.production_status = "Invoiced - Pending Dispatch"

        db.session.add(new_invoice)
        db.session.commit()

        return {
            "message": "Invoice generated successfully",
            "invoice_id": new_invoice.invoice_id,
            "amount": new_invoice.amount,
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
        invoice = db.session.get(Invoice, invoice_id)
        if not invoice:
            return error_response(404, "Invoice not found")

        invoice.paid = True
        db.session.commit()

        return {"message": "Invoice successfully marked as paid"}, 200

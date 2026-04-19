from flask import request
from flask_restful import Resource
from models import Material, Machine, Enquiry, db
from utils import error_response

class FeasibilityAPI(Resource):
    def post(self):
        """
        Run feasibility check for an enquiry (User Story 3.2.2)
        ---
        tags:
          - Feasibility
        parameters:
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - enquiry_id
              properties:
                enquiry_id:
                  type: integer
        responses:
          200:
            description: Feasibility check results
          404:
            description: Enquiry not found
        """
        data = request.get_json()
        enquiry_id = data.get("enquiry_id")
        enquiry = db.session.get(Enquiry, enquiry_id)
        if not enquiry:
            return error_response(404, "Enquiry not found")

        # Logic for feasibility check
        # 1. Check if any material is available (simplified)
        materials = Material.query.all()
        material_available = any(m.stock_quantity > 0 for m in materials)

        # 2. Check if any machine is operational
        machines = Machine.query.filter_by(status="Operational").all()
        machine_available = len(machines) > 0

        is_feasible = material_available and machine_available
        
        if is_feasible:
            enquiry.status = "Feasibility Approved"
        else:
            enquiry.status = "Feasibility Failed"
            enquiry.rejection_reason = "Insufficient materials or machine capacity"

        db.session.commit()

        return {
            "enquiry_id": enquiry_id,
            "is_feasible": is_feasible,
            "status": enquiry.status,
            "checks": {
                "material_availability": material_available,
                "machine_capacity": machine_available
            }
        }, 200

    def get(self):
        """
        Get feasibility status of all enquiries
        ---
        tags:
          - Feasibility
        responses:
          200:
            description: List of enquiries with feasibility status
        """
        enquiries = Enquiry.query.filter(Enquiry.status.like("Feasibility%")).all()
        return [
            {
                "enquiry_id": e.enquiry_id,
                "status": e.status,
                "rejection_reason": e.rejection_reason
            }
            for e in enquiries
        ], 200

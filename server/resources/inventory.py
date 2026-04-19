from flask_restful import Resource
from models import Material, Machine, Spring, db
from utils import error_response

class InventorySummaryAPI(Resource):
    def get(self):
        """
        Get summary of all inventory (User Story 3.2.7)
        ---
        tags:
          - Inventory
        responses:
          200:
            description: Inventory summary
        """
        materials = Material.query.all()
        machines = Machine.query.all()
        springs = Spring.query.all()
        
        return {
            "materials": [
                {"id": m.material_id, "name": m.name, "qty": m.stock_quantity}
                for m in materials
            ],
            "machines": [
                {"id": m.machine_id, "name": m.name, "status": m.status}
                for m in machines
            ],
            "finished_goods": [
                {"id": s.spring_id, "part_number": s.part_number, "qty": s.stock_quantity}
                for s in springs
            ]
        }, 200

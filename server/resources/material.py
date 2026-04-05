from flask_restful import Resource
from models import Material


class MaterialListAPI(Resource):
    def get(self):
        """
        Check raw material inventory (User Story 2.1)
        ---
        tags:
          - Production Planning (Epic 2)
        responses:
          200:
            description: List of available materials and stock quantities
            schema:
              type: array
              items:
                type: object
                properties:
                  material_id:
                    type: integer
                  name:
                    type: string
                  stock_quantity:
                    type: number
        """
        materials = Material.query.all()
        return [
            {
                "material_id": m.material_id,
                "name": m.name,
                "specification": m.specification,
                "stock_quantity": m.stock_quantity,
            }
            for m in materials
        ], 200

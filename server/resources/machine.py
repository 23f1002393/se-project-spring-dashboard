from flask_restful import Resource
from models import Machine


class MachineListAPI(Resource):
    def get(self):
        """
        View machine status and capacity (User Story 2.3)
        ---
        tags:
          - Production Planning (Epic 2)
        responses:
          200:
            description: List of all machines and their current status
        """
        machines = Machine.query.all()
        return [
            {
                "machine_id": m.machine_id,
                "name": m.name,
                "type": m.type,
                "status": m.status,
            }
            for m in machines
        ], 200

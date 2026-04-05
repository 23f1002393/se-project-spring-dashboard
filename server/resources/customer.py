from flask_restful import Resource
from models import Customer


class CustomerListAPI(Resource):
    def get(self):
        """
        Retrieve a list of all customers
        ---
        tags:
          - Customers
        responses:
          200:
            description: A list of customers
            schema:
              type: array
              items:
                type: object
                properties:
                  customer_id:
                    type: integer
                  name:
                    type: string
                  company_name:
                    type: string
        """
        customers = Customer.query.all()
        return [
            {
                "customer_id": c.customer_id,
                "name": c.name,
                "company_name": c.company_name,
            }
            for c in customers
        ], 200

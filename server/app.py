from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flasgger import Swagger

from resources.analytics import FinancialAnalyticsAPI, ProductionAnalyticsAPI
from resources.customer import CustomerListAPI
from resources.enquiry import EnquiryAPI, EnquiryDetailAPI
from resources.invoice import InvoiceAPI, InvoicePaymentAPI
from resources.machine import MachineListAPI
from resources.material import MaterialListAPI
from resources.quotation import QuotationAPI, QuotationReviseAPI, QuotationAcceptAPI
from resources.shipment import ShipmentDispatchAPI, ShipmentDeliveryAPI
from resources.tasks import ProductionTaskAPI, TaskStatusUpdateAPI, QualityReportAPI

# Initialize App
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///spring_plm.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SWAGGER"] = {"title": "Spring Manufacturing PLM API", "uiversion": 3}

db = SQLAlchemy(app)
api = Api(app)
swagger = Swagger(app)

# --- API ENDPOINTS --- #

# customer info
api.add_resource(CustomerListAPI, "/api/v1/customers")


# Epic 1 Route Registration
api.add_resource(EnquiryAPI, "/api/v1/enquiries")
api.add_resource(EnquiryDetailAPI, "/api/v1/enquiries/<int:enquiry_id>")
api.add_resource(QuotationAPI, "/api/v1/enquiries/<int:enquiry_id>/quotations")
api.add_resource(QuotationReviseAPI, "/api/v1/quotations/<int:quote_id>/revise")
api.add_resource(QuotationAcceptAPI, "/api/v1/quotations/<int:quote_id>/accept")

# Epic 2 Route Registration
api.add_resource(MaterialListAPI, "/api/v1/materials")
api.add_resource(MachineListAPI, "/api/v1/machines")
api.add_resource(ProductionTaskAPI, "/api/v1/tasks")

# Epic 3 Route Registration
api.add_resource(TaskStatusUpdateAPI, "/api/v1/tasks/<int:task_id>/status")
api.add_resource(QualityReportAPI, "/api/v1/tasks/<int:task_id>/quality")

# Epic 4 Route Registration
api.add_resource(InvoiceAPI, "/api/v1/orders/<int:order_id>/invoice")
api.add_resource(InvoicePaymentAPI, "/api/v1/invoices/<int:invoice_id>/pay")

# Epic 5 Route Registration
api.add_resource(ShipmentDispatchAPI, "/api/v1/orders/<int:order_id>/shipment")
api.add_resource(ShipmentDeliveryAPI, "/api/v1/shipments/<int:shipment_id>/delivery")
# Epic 6 Route Registration
api.add_resource(FinancialAnalyticsAPI, "/api/v1/analytics/financials")
api.add_resource(ProductionAnalyticsAPI, "/api/v1/analytics/production")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)

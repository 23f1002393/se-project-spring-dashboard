from flask import Flask
from flask_restful import Api
from flasgger import Swagger

from resources.analytics import (
    FinancialAnalyticsAPI,
    ProductionAnalyticsAPI,
    RawMaterialForecastAPI,
)
from resources.auth import UserRegistrationAPI, UserLoginAPI, UserLogoutAPI
from resources.enquiry import EnquiryAPI, EnquiryDetailAPI
from resources.feasibility import FeasibilityAPI
from resources.inventory import InventorySummaryAPI
from resources.invoice import InvoiceAPI, InvoicePaymentAPI
from resources.machine import (
    MachineListAPI,
    MachineMaintenanceActionAPI,
    MachineMaintenanceListAPI,
)
from resources.material import MaterialListAPI
from resources.order import OrderListAPI, OrderDetailAPI
from resources.quotation import QuotationAPI, QuotationReviseAPI, QuotationAcceptAPI
from resources.shipment import ShipmentDispatchAPI, ShipmentDeliveryAPI
from resources.tasks import ProductionTaskAPI, TaskStatusUpdateAPI, QualityReportAPI

from models import init_app_db
from flask_cors import CORS

import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Initialize App
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///spring_manufacturing.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
app.config["SWAGGER"] = {"title": "Spring Manufacturing PLM API", "uiversion": 3}

init_app_db(app)

api = Api(app)
cors = CORS(app)
swagger = Swagger(app)

# --- API ENDPOINTS --- #

# Auth
api.add_resource(UserLoginAPI, "/api/v1/auth/login")
api.add_resource(UserLogoutAPI, "/api/v1/auth/logout")
api.add_resource(UserRegistrationAPI, "/api/v1/auth/register")

# Epic 1 Route Registration
api.add_resource(EnquiryAPI, "/api/v1/enquiries")
api.add_resource(EnquiryDetailAPI, "/api/v1/enquiries/<int:enquiry_id>")
api.add_resource(QuotationAPI, "/api/v1/enquiries/<int:enquiry_id>/quotations")
api.add_resource(QuotationReviseAPI, "/api/v1/quotations/<int:quote_id>/revise")
api.add_resource(QuotationAcceptAPI, "/api/v1/quotations/<int:quote_id>/accept")
api.add_resource(FeasibilityAPI, "/api/v1/feasibility")
api.add_resource(OrderListAPI, "/api/v1/orders")
api.add_resource(OrderDetailAPI, "/api/v1/orders/<int:order_id>")

# Epic 2 Route Registration
api.add_resource(MaterialListAPI, "/api/v1/materials")
api.add_resource(MachineListAPI, "/api/v1/machines")
api.add_resource(MachineMaintenanceListAPI, "/api/v1/machines/maintenance")
api.add_resource(MachineMaintenanceActionAPI, "/api/v1/machines/<int:machine_id>/maintenance")
api.add_resource(InventorySummaryAPI, "/api/v1/inventory")
api.add_resource(ProductionTaskAPI, "/api/v1/tasks")

# Epic 3 Route Registration
api.add_resource(TaskStatusUpdateAPI, "/api/v1/tasks/<int:task_id>/status")
api.add_resource(QualityReportAPI, "/api/v1/tasks/<int:task_id>/quality")

# Epic 4 Route Registration
api.add_resource(InvoiceAPI, "/api/v1/orders/<int:order_id>/invoice")
api.add_resource(InvoicePaymentAPI, "/api/v1/invoices/<int:invoice_id>/pay")

# Epic 5 Route Registration
api.add_resource(ShipmentDispatchAPI, "/api/v1/orders/<int:order_id>/shipment", "/api/v1/shipments")
api.add_resource(ShipmentDeliveryAPI, "/api/v1/shipments/<int:shipment_id>/delivery")
# Epic 6 Route Registration
api.add_resource(FinancialAnalyticsAPI, "/api/v1/analytics/financials")
api.add_resource(ProductionAnalyticsAPI, "/api/v1/analytics/production")
api.add_resource(RawMaterialForecastAPI, "/api/v1/analytics/raw-material-forecast")

if __name__ == "__main__":
    app.run(debug=False)

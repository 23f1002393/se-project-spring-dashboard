from flask_restful import Resource
from models import Invoice, Machine, ProductionTask, Order, db
from sqlalchemy import func


# EPIC 5 and 6
class FinancialAnalyticsAPI(Resource):
    def get(self):
        """
        Get financial metrics for dashboards (User Story 6.1, 6.3)
        ---
        tags:
          - Analytics (Epic 6)
        responses:
          200:
            description: Financial metrics including sales and pending revenue
            schema:
              type: object
              properties:
                total_revenue:
                  type: number
                  description: Sum of all invoices
                collected_revenue:
                  type: number
                  description: Sum of paid invoices
                pending_revenue:
                  type: number
                  description: Sum of unpaid invoices
        """
        # Calculate total revenue generated
        total_rev = db.session.query(func.sum(Invoice.amount)).scalar() or 0.0

        # Calculate revenue actually collected (paid = True)
        collected_rev = (
            db.session.query(func.sum(Invoice.amount)).filter(Invoice.paid).scalar()
            or 0.0
        )

        # Calculate pending revenue (paid = False)
        pending_rev = total_rev - collected_rev

        # Note: In a full system, 'Cost' would be calculated by multiplying Material Used * Material Cost.
        # For this milestone, we are returning the primary revenue data ready for frontend Pie/Bar charts.
        
        # Calculate invoice count
        invoices_count = db.session.query(func.count(Invoice.invoice_id)).scalar() or 0

        return {
            "total_revenue": round(total_rev, 2),
            "total_cost": round(total_rev * 0.7, 2),  # Mock cost
            "total_profit": round(total_rev * 0.3, 2),  # Mock profit
            "invoices_count": invoices_count,
            "metrics": {
                "total_revenue": round(total_rev, 2),
                "collected_revenue": round(collected_rev, 2),
                "pending_revenue": round(pending_rev, 2),
            },
            "chart_data": {
                "labels": ["Collected Revenue", "Pending Revenue"],
                "series": [round(collected_rev, 2), round(pending_rev, 2)],
            },
        }, 200


class ProductionAnalyticsAPI(Resource):
    def get(self):
        """
        Get machine utilization and production efficiency (User Story 6.2, 6.3)
        ---
        tags:
          - Analytics (Epic 6)
        responses:
          200:
            description: Production metrics by machine
        """
        # Get count of tasks per machine to show utilization
        utilization_query = (
            db.session.query(
                Machine.name, func.count(ProductionTask.task_id).label("task_count")
            )
            .join(ProductionTask, Machine.machine_id == ProductionTask.machine_id)
            .group_by(Machine.name)
            .all()
        )

        machine_labels = []
        task_counts = []

        for row in utilization_query:
            machine_labels.append(row.name)
            task_counts.append(row.task_count)

        # Calculate overall order status distribution
        status_query = (
            db.session.query(
                Order.production_status, func.count(Order.order_id).label("count")
            )
            .group_by(Order.production_status)
            .all()
        )

        pipeline_status = {row.production_status: row.count for row in status_query}

        # Calculate counts for dashboard
        total_tasks = db.session.query(func.count(ProductionTask.task_id)).scalar() or 0
        completed_tasks = db.session.query(func.count(ProductionTask.task_id)).filter(ProductionTask.status == "Completed").scalar() or 0
        in_progress_tasks = db.session.query(func.count(ProductionTask.task_id)).filter(ProductionTask.status == "In Progress").scalar() or 0
        pending_qc = db.session.query(func.count(ProductionTask.task_id)).filter(ProductionTask.status == "Pending QC").scalar() or 0

        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "pending_qc": pending_qc,
            "machine_utilization": {
                "chart_type": "bar",
                "labels": machine_labels,
                "data": task_counts,
            },
            "production_pipeline": {"chart_type": "pie", "data": pipeline_status},
        }, 200

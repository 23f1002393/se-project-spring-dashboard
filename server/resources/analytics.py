from datetime import datetime, timedelta, timezone

from flask import request
from flask_restful import Resource
from models import Invoice, Machine, Material, ProductionTask, Order, db
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


class RawMaterialForecastAPI(Resource):
    def get(self):
        """
        Forecast raw material inventory requirement from historical spring production
        ---
        tags:
          - Analytics (Epic 6)
        parameters:
          - in: query
            name: horizon_days
            type: integer
            required: false
            default: 30
            description: Number of future days to forecast
          - in: query
            name: lookback_days
            type: integer
            required: false
            default: 90
            description: Number of historical days to use for trend calculation
          - in: query
            name: wastage_percent
            type: number
            required: false
            default: 5
            description: Additional wastage percentage to apply on calculated consumption
        responses:
          200:
            description: Forecast summary and top-10 raw material chart data
        """
        def parse_int(val, default):
            try:
                return int(val) if val is not None else default
            except (ValueError, TypeError):
                return default

        def parse_float(val, default):
            try:
                return float(val) if val is not None else default
            except (ValueError, TypeError):
                return default

        horizon_days = max(parse_int(request.args.get("horizon_days"), 30), 1)
        lookback_days = max(parse_int(request.args.get("lookback_days"), 90), 1)
        wastage_percent = max(parse_float(request.args.get("wastage_percent"), 5), 0)

        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=lookback_days)
        wastage_multiplier = 1 + (wastage_percent / 100)

        # In SQLite, ensure we handle naive vs aware correctly if column is not timezone aware
        historical_tasks = (
            ProductionTask.query.filter(
                ProductionTask.status == "Completed",
                ProductionTask.completed_at.isnot(None),
                ProductionTask.completed_at >= start_date,
            )
            .order_by(ProductionTask.completed_at.asc())
            .all()
        )

        usage_by_material = {}
        for task in historical_tasks:
            if not task.material_id:
                continue

            estimated_springs = task.estimated_springs_produced or 0
            if estimated_springs <= 0:
                continue

            wire_diameter = (
                task.order.spring.wire_diameter
                if task.order and task.order.spring and task.order.spring.wire_diameter
                else 1.0
            )

            # Notebook-aligned proxy logic:
            # base material use is derived from historical produced springs with diameter factor,
            # and then wastage is applied as a multiplicative uplift.
            base_material_kg = estimated_springs * max(float(wire_diameter) * 0.01, 0.01)
            adjusted_material_kg = base_material_kg * wastage_multiplier

            usage_by_material[task.material_id] = (
                usage_by_material.get(task.material_id, 0) + adjusted_material_kg
            )

        material_rows = []
        materials = Material.query.order_by(Material.name.asc()).all()

        for material in materials:
            historical_consumed_kg = usage_by_material.get(material.material_id, 0.0)
            avg_daily_consumption_kg = historical_consumed_kg / lookback_days
            forecast_required_kg = avg_daily_consumption_kg * horizon_days
            current_stock_kg = float(material.stock_quantity or 0.0)
            projected_stock_kg = current_stock_kg - forecast_required_kg
            safety_stock_kg = avg_daily_consumption_kg * 14  # 2-week rolling buffer
            recommended_purchase_kg = max(forecast_required_kg - current_stock_kg, 0.0)

            if projected_stock_kg < 0:
                status = "critical"
            elif projected_stock_kg < safety_stock_kg:
                status = "warning"
            else:
                status = "healthy"

            material_rows.append(
                {
                    "material_id": material.material_id,
                    "material_name": material.name,
                    "historical_consumed_kg": round(historical_consumed_kg, 2),
                    "avg_daily_consumption_kg": round(avg_daily_consumption_kg, 3),
                    "forecast_required_kg": round(forecast_required_kg, 2),
                    "current_stock_kg": round(current_stock_kg, 2),
                    "projected_stock_kg": round(projected_stock_kg, 2),
                    "safety_stock_kg": round(safety_stock_kg, 2),
                    "recommended_purchase_kg": round(recommended_purchase_kg, 2),
                    "status": status,
                }
            )

        material_rows.sort(key=lambda item: item["forecast_required_kg"], reverse=True)
        top_ten = material_rows[:10]

        return {
            "parameters": {
                "horizon_days": horizon_days,
                "lookback_days": lookback_days,
                "wastage_percent": wastage_percent,
            },
            "summary": {
                "materials_tracked": len(material_rows),
                "total_forecast_required_kg": round(
                    sum(item["forecast_required_kg"] for item in material_rows), 2
                ),
                "total_current_stock_kg": round(
                    sum(item["current_stock_kg"] for item in material_rows), 2
                ),
                "total_recommended_purchase_kg": round(
                    sum(item["recommended_purchase_kg"] for item in material_rows), 2
                ),
            },
            "materials": material_rows,
            "top_ten": top_ten,
            "chart_data": {
                "chart_type": "bar",
                "labels": [item["material_name"] for item in top_ten],
                "series": [item["forecast_required_kg"] for item in top_ten],
            },
        }, 200

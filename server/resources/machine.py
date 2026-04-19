import math
from datetime import datetime, timedelta, timezone

from flask_restful import Resource

from models import Machine, ProductionTask, db
from utils import error_response


def _serialize_datetime(value):
    if not value:
        return None
    if isinstance(value, str):
        return value
    return value.isoformat()


def _task_reference_date(task):
    val = task.completed_at or task.scheduled_at
    if val and val.tzinfo is None:
        return val.replace(tzinfo=timezone.utc)
    return val


def _task_output_usage(task):
    estimated_output = task.estimated_springs_produced or 0
    if task.status == "Completed" or task.status == "QC Passed" or task.status == "QC Failed":
        return estimated_output
    if task.status == "In Progress":
        return int(round(estimated_output * ((task.progress or 0) / 100)))
    return 0


def _task_assignment(task):
    spring = task.order.spring if task.order and task.order.spring else None
    return {
        "task_id": task.task_id,
        "order_id": task.order_id,
        "part_number": spring.part_number if spring else None,
        "status": task.status,
        "progress": task.progress,
        "estimated_springs_produced": task.estimated_springs_produced or 0,
    }


def _build_maintenance_summary(machine):
    now = datetime.now(timezone.utc)
    threshold = machine.maintenance_threshold or 10000
    warning_threshold = machine.maintenance_warning_threshold or int(threshold * 0.8)

    machine_last = machine.last_maintenance_at
    if machine_last and machine_last.tzinfo is None:
        machine_last = machine_last.replace(tzinfo=timezone.utc)

    relevant_tasks = []
    for task in machine.tasks:
        reference_date = _task_reference_date(task)
        if machine_last and reference_date:
            if reference_date < machine_last:
                continue
        relevant_tasks.append(task)

    usage_since_maintenance = sum(_task_output_usage(task) for task in relevant_tasks)
    remaining_capacity = max(threshold - usage_since_maintenance, 0)
    utilization_percent = round(
        min((usage_since_maintenance / threshold) * 100, 100), 1
    ) if threshold else 0

    active_tasks = [
        task for task in machine.tasks if task.status in {"Scheduled", "In Progress"}
    ]

    dated_tasks = [
        task for task in relevant_tasks if _task_reference_date(task) and _task_output_usage(task) > 0
    ]
    if dated_tasks:
        first_date = min(_task_reference_date(task) for task in dated_tasks)
        # first_date is already made aware by _task_reference_date
        days_span = max((now - first_date).days + 1, 1)
        avg_daily_output = usage_since_maintenance / days_span
    else:
        avg_daily_output = 0

    if machine.status != "Operational" and machine.status != "Active":
        severity = "inactive"
        action_needed = "Machine is offline. Resume production before scheduling maintenance."
        scheduled_for = None
    elif usage_since_maintenance >= threshold:
        severity = "critical"
        action_needed = "Maintenance is overdue. Service this machine before assigning more work."
        scheduled_for = now
    elif usage_since_maintenance >= warning_threshold:
        severity = "warning"
        action_needed = "Maintenance window approaching. Plan service after current assignments."
        scheduled_for = (
            now + timedelta(days=max(math.ceil(remaining_capacity / avg_daily_output), 0))
            if avg_daily_output > 0
            else None
        )
    else:
        severity = "ok"
        action_needed = "No immediate action required."
        scheduled_for = (
            now + timedelta(days=max(math.ceil(remaining_capacity / avg_daily_output), 0))
            if avg_daily_output > 0
            else None
        )

    return {
        "machine_id": machine.machine_id,
        "name": machine.name,
        "type": machine.type,
        "status": machine.status,
        "last_maintenance_at": _serialize_datetime(machine.last_maintenance_at),
        "scheduled_maintenance_at": _serialize_datetime(scheduled_for),
        "maintenance_threshold": threshold,
        "maintenance_warning_threshold": warning_threshold,
        "usage_since_maintenance": usage_since_maintenance,
        "remaining_capacity": remaining_capacity,
        "utilization_percent": utilization_percent,
        "severity": severity,
        "action_needed": action_needed,
        "active_assignments": [_task_assignment(task) for task in active_tasks],
    }


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
                "maintenance_threshold": m.maintenance_threshold,
                "maintenance_warning_threshold": m.maintenance_warning_threshold,
                "last_maintenance_at": _serialize_datetime(m.last_maintenance_at),
            }
            for m in machines
        ], 200


class MachineMaintenanceListAPI(Resource):
    def get(self):
        """
        Get machine maintenance notifications and assignments
        ---
        tags:
          - Production Planning (Epic 2)
        responses:
          200:
            description: List of machines with maintenance status, schedule, and action-needed details
        """
        machines = Machine.query.order_by(Machine.name.asc()).all()
        return [_build_maintenance_summary(machine) for machine in machines], 200


class MachineMaintenanceActionAPI(Resource):
    def post(self, machine_id):
        """
        Record a machine maintenance event
        ---
        tags:
          - Production Planning (Epic 2)
        parameters:
          - name: machine_id
            in: path
            type: integer
            required: true
        responses:
          200:
            description: Machine maintenance recorded successfully
          404:
            description: Machine not found
        """
        machine = db.session.get(Machine, machine_id)
        if not machine:
            return error_response(404, f"Machine ID {machine_id} not found")

        machine.last_maintenance_at = datetime.now(timezone.utc)
        db.session.commit()

        return {
            "message": f"Maintenance recorded for {machine.name}",
            "machine": _build_maintenance_summary(machine),
        }, 200

import { fetchApi } from "@/lib/api";

export interface Machine {
  machine_id: number;
  name: string;
  type: string;
  status: string;
  maintenance_threshold?: number;
  maintenance_warning_threshold?: number;
  last_maintenance_at?: string;
}

export interface MachineMaintenanceSummary {
  machine_id: number;
  name: string;
  type: string;
  status: string;
  last_maintenance_at: string | null;
  scheduled_maintenance_at: string | null;
  maintenance_threshold: number;
  maintenance_warning_threshold: number;
  usage_since_maintenance: number;
  remaining_capacity: number;
  utilization_percent: number;
  severity: "ok" | "warning" | "critical" | "inactive";
  action_needed: string;
  active_assignments: any[];
}

export async function getMachines(): Promise<Machine[]> {
  return fetchApi<Machine[]>("/machines");
}

export async function getMachineMaintenanceList(): Promise<MachineMaintenanceSummary[]> {
  return fetchApi<MachineMaintenanceSummary[]>("/machines/maintenance");
}

export async function recordMaintenanceAction(machineId: number): Promise<{ message: string; machine: MachineMaintenanceSummary }> {
  return fetchApi<{ message: string; machine: MachineMaintenanceSummary }>(`/machines/${machineId}/maintenance`, {
    method: "POST",
  });
}

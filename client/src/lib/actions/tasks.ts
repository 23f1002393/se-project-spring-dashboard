import { fetchApi } from "@/lib/api";

export interface ProductionTask {
  id: number | string;
  order_id: number | string;
  machine_id: number | string;
  status: string;
  progress?: number;
}

/**
 * Fetch all production tasks.
 */
export async function getTasks(): Promise<ProductionTask[]> {
  return fetchApi<ProductionTask[]>("/tasks");
}

/**
 * Update the status of a production task.
 */
export async function updateTaskStatus(
  taskId: number,
  status: string
): Promise<ProductionTask> {
  return fetchApi<ProductionTask>(`/tasks/${taskId}/status`, {
    data: { status },
    method: "PUT",
  });
}

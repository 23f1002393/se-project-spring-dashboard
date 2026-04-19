import { fetchApi } from "@/lib/api";

export interface InventorySummary {
  materials: { id: number; name: string; qty: number }[];
  machines: { id: number; name: string; status: string }[];
  finished_goods: { id: number; part_number: string; qty: number }[];
}

export async function getInventorySummary(): Promise<InventorySummary> {
  return fetchApi<InventorySummary>("/inventory");
}

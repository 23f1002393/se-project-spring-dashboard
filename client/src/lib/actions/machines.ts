import { fetchApi } from "@/lib/api";

export interface Machine {
  machine_id: number;
  name: string;
  type: string;
  status: string;
}

export async function getMachines(): Promise<Machine[]> {
  return fetchApi<Machine[]>("/machines");
}

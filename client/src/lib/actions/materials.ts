import { fetchApi } from "@/lib/api";

export interface Material {
  material_id: number;
  name: string;
  specification: string;
  stock_quantity: number;
}

export async function getMaterials(): Promise<Material[]> {
  return fetchApi<Material[]>("/materials");
}

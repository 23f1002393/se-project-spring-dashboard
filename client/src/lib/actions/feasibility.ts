import { fetchApi } from "@/lib/api";

export interface FeasibilityResult {
  enquiry_id: number;
  is_feasible: boolean;
  status: string;
  checks: {
    material_availability: boolean;
    machine_capacity: boolean;
  };
}

export async function runFeasibilityCheck(enquiryId: number): Promise<FeasibilityResult> {
  return fetchApi<FeasibilityResult>("/feasibility", {
    method: "POST",
    data: { enquiry_id: enquiryId },
  });
}

export async function getFeasibilityStatus(): Promise<any[]> {
  return fetchApi<any[]>("/feasibility");
}

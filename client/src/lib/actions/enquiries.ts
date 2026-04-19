import { fetchApi } from "@/lib/api";

export interface Enquiry {
  id: number | string;
  customer_id: number | string;
  product_spec: string;
  quantity?: number;
  status: string;
  rejection_reason?: string;
  created_at: string;
}

/**
 * Fetch all enquiries.
 */
export async function getEnquiries(): Promise<Enquiry[]> {
  return fetchApi<Enquiry[]>("/enquiries");
}

/**
 * Fetch a single enquiry by ID.
 */
export async function getEnquiry(id: number): Promise<Enquiry> {
  return fetchApi<Enquiry>(`/enquiries/${id}`);
}

/**
 * Create a new enquiry.
 */
export async function createEnquiry(data: Partial<Enquiry>): Promise<Enquiry> {
  return fetchApi<Enquiry>("/enquiries", { data });
}

/**
 * Update an existing enquiry.
 */
export async function updateEnquiry(
  id: number | string,
  data: Partial<Enquiry>
): Promise<any> {
  return fetchApi<any>(`/enquiries/${id}`, {
    method: "PUT",
    data,
  });
}

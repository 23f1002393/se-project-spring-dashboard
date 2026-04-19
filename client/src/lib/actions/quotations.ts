import { fetchApi } from "@/lib/api";

export interface Quotation {
  id: number | string;
  enquiry_id?: number;
  product: string;
  amount: string;
  date: string;
  status: string;
  version?: number;
}

/**
 * Fetch quotations for a given enquiry.
 */
export async function getQuotations(enquiryId: number): Promise<Quotation[]> {
  return fetchApi<Quotation[]>(`/enquiries/${enquiryId}/quotations`);
}

/**
 * Create a new quotation for an enquiry.
 */
export async function createQuotation(
  enquiryId: number,
  data: { price: number; est_delivery: string }
): Promise<any> {
  return fetchApi<any>(`/enquiries/${enquiryId}/quotations`, {
    method: "POST",
    data,
  });
}

/**
 * Accept a quotation.
 */
export async function acceptQuotation(
  quoteId: number,
  springId: number = 1
): Promise<any> {
  return fetchApi<any>(`/quotations/${quoteId}/accept`, {
    method: "POST",
    data: { spring_id: springId },
  });
}

/**
 * Revise a quotation.
 */
export async function reviseQuotation(
  quoteId: number,
  data: Partial<Quotation>
): Promise<any> {
  return fetchApi<any>(`/quotations/${quoteId}/revise`, { data });
}

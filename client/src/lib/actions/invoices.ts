import { fetchApi } from "@/lib/api";

/**
 * Generate an invoice for an order.
 */
export async function issueInvoice(orderId: number, data?: { manual_amount: number }): Promise<any> {
  return fetchApi<any>(`/orders/${orderId}/invoice`, {
    method: "POST",
    data,
  });
}

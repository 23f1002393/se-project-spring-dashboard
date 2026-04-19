import { fetchApi } from "@/lib/api";

export interface Shipment {
  shipment_id: number | string;
  order_id: number | string;
  status: string;
  shipped_date: string;
  carrier: string;
  tracking_number: string;
  customer_feedback?: string;
}

/**
 * Fetch all shipments.
 */
export async function getShipments(): Promise<Shipment[]> {
  return fetchApi<Shipment[]>("/shipments");
}

/**
 * Dispatch a shipment for an order.
 */
export async function dispatchShipment(orderId: number, data: { carrier: string; tracking_number: string }): Promise<any> {
  return fetchApi<any>(`/orders/${orderId}/shipment`, {
    data,
    method: "POST",
  });
}

/**
 * Update delivery status of a shipment.
 */
export async function updateDelivery(
  shipmentId: number,
  data: { delivery_status: string; customer_feedback?: string; rejection_reason?: string }
): Promise<any> {
  return fetchApi<any>(`/shipments/${shipmentId}/delivery`, {
    data,
    method: "PUT",
  });
}

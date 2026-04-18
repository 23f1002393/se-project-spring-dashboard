import { fetchApi } from "@/lib/api";

export interface Shipment {
  id: number | string;
  orderId: number | string;
  status: string;
  dispatchDate: string;
}

/**
 * Dispatch a shipment for an order.
 */
export async function dispatchShipment(orderId: number): Promise<Shipment> {
  return fetchApi<Shipment>(`/orders/${orderId}/shipment`, {
    method: "POST",
  });
}

/**
 * Update delivery status of a shipment.
 */
export async function updateDelivery(
  shipmentId: number,
  data: { status: string; feedback?: string }
): Promise<any> {
  return fetchApi<any>(`/shipments/${shipmentId}/delivery`, {
    data,
    method: "PUT",
  });
}

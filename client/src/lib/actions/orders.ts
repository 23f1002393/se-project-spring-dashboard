import { fetchApi } from "@/lib/api";

export interface Order {
  order_id: number;
  quote_id: number;
  spring_id: number;
  production_status: string;
}

export async function getOrders(): Promise<Order[]> {
  return fetchApi<Order[]>("/orders");
}

export async function getOrderDetail(orderId: number): Promise<any> {
  return fetchApi<any>(`/orders/${orderId}`);
}

import { fetchApi } from "@/lib/api";

export interface FinancialAnalytics {
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  invoices_count: number;
}

export interface ProductionAnalytics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_qc: number;
}

/**
 * Fetch financial analytics data.
 */
export async function getFinancialAnalytics(): Promise<FinancialAnalytics> {
  return fetchApi<FinancialAnalytics>("/analytics/financials");
}

/**
 * Fetch production analytics data.
 */
export async function getProductionAnalytics(): Promise<ProductionAnalytics> {
  return fetchApi<ProductionAnalytics>("/analytics/production");
}

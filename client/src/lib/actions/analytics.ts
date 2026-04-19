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

export interface MaterialForecast {
  material_id: number;
  material_name: string;
  historical_consumed_kg: number;
  avg_daily_consumption_kg: number;
  forecast_required_kg: number;
  current_stock_kg: number;
  projected_stock_kg: number;
  safety_stock_kg: number;
  recommended_purchase_kg: number;
  status: "critical" | "warning" | "healthy";
}

export interface RawMaterialForecast {
  parameters: {
    horizon_days: number;
    lookback_days: number;
    wastage_percent: number;
  };
  summary: {
    materials_tracked: number;
    total_forecast_required_kg: number;
    total_current_stock_kg: number;
    total_recommended_purchase_kg: number;
  };
  materials: MaterialForecast[];
  top_ten: MaterialForecast[];
  chart_data: {
    chart_type: string;
    labels: string[];
    series: number[];
  };
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

/**
 * Fetch raw material forecast data.
 */
export async function getRawMaterialForecast(
  horizonDays: number = 30,
  lookbackDays: number = 90,
  wastagePercent: number = 5
): Promise<RawMaterialForecast> {
  return fetchApi<RawMaterialForecast>(
    `/analytics/raw-material-forecast?horizon_days=${horizonDays}&lookback_days=${lookbackDays}&wastage_percent=${wastagePercent}`
  );
}

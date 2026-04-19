import { useState, useEffect, useOptimistic, useActionState, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  FileText,
  CheckCircle,
  Truck,
  ClipboardList,
  TrendingUp,
  Clock,
  Package,
  Layers,
  Wrench,
  Calculator,
  AlertTriangle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getEnquiries, type Enquiry } from "@/lib/actions/enquiries";
import {
  getTasks,
  updateTaskStatus,
  createQualityReport,
  type ProductionTask,
} from "@/lib/actions/tasks";
import {
  getFinancialAnalytics,
  getProductionAnalytics,
  getRawMaterialForecast,
  type FinancialAnalytics,
  type ProductionAnalytics,
  type RawMaterialForecast,
} from "@/lib/actions/analytics";
import { getOrders, type Order } from "@/lib/actions/orders";
import {
  getShipments,
  dispatchShipment,
  type Shipment,
} from "@/lib/actions/shipments";
import { createQuotation, getQuotations } from "@/lib/actions/quotations";
import { issueInvoice } from "@/lib/actions/invoices";
import {
  getMachineMaintenanceList,
  recordMaintenanceAction,
  type MachineMaintenanceSummary,
} from "@/lib/actions/machines";
import {
  getInventorySummary,
  type InventorySummary,
} from "@/lib/actions/inventory";
import { runFeasibilityCheck } from "@/lib/actions/feasibility";

// --- Skeleton Components ---

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card
          key={i}
          className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- Types ---

interface AnalyticsState {
  financial: FinancialAnalytics | null;
  production: ProductionAnalytics | null;
}

interface EnquiryQuotation {
  quote_id: number;
  version_number: number;
  price: number;
  est_delivery: string | null;
  is_accepted: boolean;
}

const TABS = [
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "enquiries", label: "Enquiries", icon: FileText },
  { id: "orders", label: "Orders", icon: Package },
  { id: "production", label: "Production", icon: ClipboardList },
  { id: "quality", label: "Quality", icon: CheckCircle },
  { id: "logistics", label: "Logistics", icon: Truck },
  { id: "inventory", label: "Inventory", icon: Layers },
  { id: "forecasting", label: "Forecasting", icon: Calculator },
];

// --- Action functions for useActionState ---

async function fetchAnalyticsAction(_prev: AnalyticsState | null): Promise<AnalyticsState | null> {
  const [financial, production] = await Promise.allSettled([
    getFinancialAnalytics(),
    getProductionAnalytics(),
  ]);
  return {
    financial: financial.status === "fulfilled" ? financial.value : null,
    production: production.status === "fulfilled" ? production.value : null,
  };
}

async function fetchEnquiriesAction(_prev: Enquiry[]): Promise<Enquiry[]> {
  return getEnquiries();
}

async function fetchTasksAction(_prev: ProductionTask[]): Promise<ProductionTask[]> {
  return getTasks();
}

async function fetchOrdersAction(_prev: Order[]): Promise<Order[]> {
  return getOrders();
}

async function fetchShipmentsAction(_prev: Shipment[]): Promise<Shipment[]> {
  return getShipments();
}

async function fetchInventoryAction(_prev: InventorySummary): Promise<InventorySummary> {
  return getInventorySummary();
}

async function fetchForecastAction(_prev: RawMaterialForecast | null): Promise<RawMaterialForecast | null> {
  return getRawMaterialForecast();
}

async function fetchMaintenanceAction(_prev: MachineMaintenanceSummary[]): Promise<MachineMaintenanceSummary[]> {
  return getMachineMaintenanceList();
}

export function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [selectedEnquiryQuotes, setSelectedEnquiryQuotes] = useState<
    EnquiryQuotation[]
  >([]);
  const [selectedEnquiryOrders, setSelectedEnquiryOrders] = useState<Order[]>([]);
  const [selectedEnquiryShipments, setSelectedEnquiryShipments] = useState<
    Shipment[]
  >([]);
  const [enquiryDetailsLoading, setEnquiryDetailsLoading] = useState(false);
  const [enquiryDetailsError, setEnquiryDetailsError] = useState<string | null>(
    null
  );

  // useActionState for each data source
  const [analytics, loadAnalytics, analyticsLoading] = useActionState(
    fetchAnalyticsAction,
    null
  );
  const [enquiries, loadEnquiries, enquiriesLoading] = useActionState(
    fetchEnquiriesAction,
    []
  );
  const [tasks, loadTasks, tasksLoading] = useActionState(fetchTasksAction, []);
  const [orders, loadOrders, ordersLoading] = useActionState(fetchOrdersAction, []);
  const [shipments, loadShipments, shipmentsLoading] = useActionState(
    fetchShipmentsAction,
    []
  );
  const [inventory, loadInventory, inventoryLoading] = useActionState(
    fetchInventoryAction,
    { machines: [], materials: [], finished_goods: [] }
  );
  const [forecast, loadForecast, forecastLoading] = useActionState(
    fetchForecastAction,
    null
  );
  const [maintenance, loadMaintenance, maintenanceLoading] = useActionState(
    fetchMaintenanceAction,
    []
  );

  // Optimistic task updates
  const [optimisticTasks, setOptimisticTask] = useOptimistic(
    tasks,
    (currentTasks: ProductionTask[], updatedTask: ProductionTask) =>
      currentTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
  );

  const handleUpdateTaskStatus = async (
    taskId: number | string,
    newStatus: string
  ) => {
    const taskToUpdate = optimisticTasks.find((t) => t.id === taskId);
    if (taskToUpdate) {
      startTransition(() => {
        setOptimisticTask({ ...taskToUpdate, status: newStatus });
      });
    }
    try {
      await updateTaskStatus(Number(taskId), newStatus);
      loadTasks();
      loadAnalytics();
    } catch (err) {
      console.error("Failed to update task", err);
      loadTasks();
    }
  };

  const handleFeasibilityCheck = async (enquiryId: number) => {
    try {
      await runFeasibilityCheck(enquiryId);
      loadEnquiries();
      loadAnalytics();
    } catch (err) {
      console.error("Feasibility check failed", err);
    }
  };

  const handleGenerateQuote = async (enquiryId: number) => {
    try {
      await createQuotation(enquiryId, {
        price: 1500.0,
        est_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
      loadEnquiries();
      loadAnalytics();
    } catch (err) {
      console.error("Failed to generate quote", err);
    }
  };

  const handleViewEnquiryDetails = async (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setSelectedEnquiryQuotes([]);
    setSelectedEnquiryOrders([]);
    setSelectedEnquiryShipments([]);
    setEnquiryDetailsError(null);
    setEnquiryDetailsLoading(true);

    try {
      const [quotesResult, ordersResult, shipmentsResult] =
        await Promise.allSettled([
          getQuotations(Number(enquiry.id)),
          getOrders(),
          getShipments(),
        ]);

      const quotes: EnquiryQuotation[] =
        quotesResult.status === "fulfilled"
          ? (quotesResult.value as unknown as EnquiryQuotation[])
          : [];
      const allOrders: Order[] =
        ordersResult.status === "fulfilled" ? ordersResult.value : [];
      const allShipments: Shipment[] =
        shipmentsResult.status === "fulfilled" ? shipmentsResult.value : [];

      const quoteIds = new Set(quotes.map((quote) => Number(quote.quote_id)));
      const linkedOrders = allOrders.filter((order) =>
        quoteIds.has(Number(order.quote_id))
      );
      const linkedOrderIds = new Set(
        linkedOrders.map((order) => Number(order.order_id))
      );
      const linkedShipments = allShipments.filter((shipment) =>
        linkedOrderIds.has(Number(shipment.order_id))
      );

      setSelectedEnquiryQuotes(quotes);
      setSelectedEnquiryOrders(linkedOrders);
      setSelectedEnquiryShipments(linkedShipments);

      if (
        quotesResult.status === "rejected" ||
        ordersResult.status === "rejected" ||
        shipmentsResult.status === "rejected"
      ) {
        setEnquiryDetailsError(
          "Some tracking details could not be loaded right now."
        );
      }
    } catch (err) {
      console.error("Failed to load enquiry details", err);
      setEnquiryDetailsError("Unable to load details. Please try again.");
    } finally {
      setEnquiryDetailsLoading(false);
    }
  };

  const handleQualitySubmit = async (taskId: number, result: string) => {
    try {
      await createQualityReport(taskId, { inspector: "Spring Master", result });
      loadTasks();
      loadOrders();
      loadAnalytics();
    } catch (err) {
      console.error("Quality report submission failed", err);
    }
  };

  const handleIssueInvoice = async (orderId: number) => {
    try {
      await issueInvoice(orderId);
      loadOrders();
      loadAnalytics();
    } catch (err) {
      console.error("Failed to issue invoice", err);
    }
  };

  const handleDispatch = async (orderId: number) => {
    try {
      await dispatchShipment(orderId, {
        carrier: "Standard Delivery",
        tracking_number: `TRK-${Math.floor(Math.random() * 1000000)}`,
      });
      loadOrders();
      loadShipments();
      loadAnalytics();
    } catch (err) {
      console.error("Dispatch failed", err);
    }
  };

  const handleMaintenanceRecord = async (machineId: number) => {
    try {
      await recordMaintenanceAction(machineId);
      // loadMaintenance is the dispatch function from useActionState. 
      // Calling it triggers the action function.
      loadMaintenance();
    } catch (err) {
      console.error("Failed to record maintenance", err);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === "analytics") loadAnalytics();
    else if (activeTab === "enquiries") loadEnquiries();
    else if (activeTab === "production" || activeTab === "quality")
      loadTasks();
    else if (activeTab === "orders") loadOrders();
    else if (activeTab === "logistics") loadShipments();
    else if (activeTab === "inventory") loadInventory();
    else if (activeTab === "forecasting") {
      loadForecast();
      loadMaintenance();
    }
  }, [activeTab]);

  const isLoading =
    analyticsLoading ||
    enquiriesLoading ||
    tasksLoading ||
    ordersLoading ||
    shipmentsLoading ||
    inventoryLoading ||
    forecastLoading ||
    maintenanceLoading;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 font-sans md:p-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Manager Overview
          </h1>
          {isLoading && (
            <div className="flex animate-pulse items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> Updating...
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Manage end-to-end production and operations.
        </p>
      </div>

      {/* Top Level Metrics */}
      {analyticsLoading || !analytics ? (
        <MetricsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Revenue (MTD)",
              value:
                analytics.financial?.total_revenue !== undefined
                  ? `$${analytics.financial.total_revenue.toLocaleString()}`
                  : "—",
              icon: TrendingUp,
              trend: `Profit: $${analytics.financial?.total_profit?.toLocaleString() ?? 0}`,
            },
            {
              title: "Active Orders",
              value: analytics.production?.total_tasks ?? 0,
              icon: Package,
              trend: "Across all stages",
            },
            {
              title: "Tasks In Progress",
              value: analytics.production?.in_progress_tasks ?? 0,
              icon: ClipboardList,
              trend: `${analytics.production?.completed_tasks ?? 0} completed`,
            },
            {
              title: "Pending QC",
              value: analytics.production?.pending_qc ?? 0,
              icon: CheckCircle,
              trend: "Awaiting inspection",
            },
          ].map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, ease: "easeOut", duration: 0.4 }}
            >
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl transition-all hover:bg-background/80 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <metric.icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{metric.value}</div>
                  <p className="mt-1 text-xs font-medium text-muted-foreground/80">
                    {metric.trend}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="scrollbar-hide flex overflow-x-auto border-b border-border/50 pb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="manager-active-tab"
                  className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeTab === "analytics" && (
              <Card className="overflow-hidden border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Financial & Operational Analytics</CardTitle>
                  <CardDescription>
                    Overview of key performance indicators.
                  </CardDescription>
                </CardHeader>
                <CardContent className="border-t border-border/40 bg-muted/10 p-6">
                  {analytics?.financial ? (
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                      {[
                        {
                          label: "Revenue",
                          value: `$${analytics.financial.total_revenue?.toLocaleString() ?? 0}`,
                        },
                        {
                          label: "Cost",
                          value: `$${analytics.financial.total_cost?.toLocaleString() ?? 0}`,
                        },
                        {
                          label: "Profit",
                          value: `$${analytics.financial.total_profit?.toLocaleString() ?? 0}`,
                        },
                        {
                          label: "Invoices",
                          value: analytics.financial.invoices_count ?? 0,
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-border/40 bg-background/80 p-4 text-center"
                        >
                          <p className="text-xs font-medium text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xl font-semibold">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <BarChart className="h-12 w-12 opacity-20" />
                      <p>No analytics data available.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "enquiries" && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Enquiry Management</CardTitle>
                  <CardDescription>
                    Review customer requests and perform feasibility checks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {enquiriesLoading ? (
                    <TableSkeleton cols={5} />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Product Spec</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enquiries.length > 0 ? (
                            enquiries.map((enq) => (
                              <TableRow key={enq.id}>
                                <TableCell className="font-medium">
                                  {enq.id}
                                </TableCell>
                                <TableCell>{enq.customer_id}</TableCell>
                                <TableCell>{enq.product_spec}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{enq.status}</Badge>
                                </TableCell>
                                <TableCell className="flex justify-end gap-2 text-right">
                                  {enq.status === "New" && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleFeasibilityCheck(Number(enq.id))
                                      }
                                    >
                                      Run Feasibility
                                    </Button>
                                  )}
                                  {enq.status === "Feasibility Approved" && (
                                    <Button
                                      size="sm"
                                      className="bg-primary text-primary-foreground"
                                      onClick={() =>
                                        handleGenerateQuote(Number(enq.id))
                                      }
                                    >
                                      Generate Quote
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewEnquiryDetails(enq)}
                                  >
                                    View Details
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No enquiries found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {selectedEnquiry && (
                    <div className="mt-4 rounded-lg border border-border/50 bg-muted/20 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Enquiry #{selectedEnquiry.id} Details
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Order commitments and delivery tracking view.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedEnquiry(null)}
                        >
                          Close
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-2">
                        <div>
                          <span className="font-medium text-foreground">
                            Customer:
                          </span>{" "}
                          {selectedEnquiry.customer_id}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Status:
                          </span>{" "}
                          {selectedEnquiry.status}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-foreground">
                            Product Spec:
                          </span>{" "}
                          {selectedEnquiry.product_spec}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Quantity:
                          </span>{" "}
                          {selectedEnquiry.quantity ?? "—"}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">
                            Created:
                          </span>{" "}
                          {selectedEnquiry.created_at
                            ? new Date(selectedEnquiry.created_at).toLocaleString()
                            : "—"}
                        </div>
                      </div>

                      {enquiryDetailsLoading ? (
                        <div className="mt-3 text-xs text-muted-foreground">
                          Loading linked quotation, order, and shipment details...
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                              Quotation Commitments
                            </p>
                            {selectedEnquiryQuotes.length > 0 ? (
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {selectedEnquiryQuotes.map((quote) => (
                                  <div
                                    key={quote.quote_id}
                                    className="flex flex-wrap gap-x-4 gap-y-1 rounded border border-border/40 bg-background/60 px-2 py-1"
                                  >
                                    <span>Quote #{quote.quote_id}</span>
                                    <span>Version {quote.version_number}</span>
                                    <span>${quote.price.toLocaleString()}</span>
                                    <span>
                                      ETA: {quote.est_delivery ?? "Not set"}
                                    </span>
                                    <span>
                                      {quote.is_accepted
                                        ? "Accepted"
                                        : "Pending decision"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No quotations yet for this enquiry.
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                              Order Commitments
                            </p>
                            {selectedEnquiryOrders.length > 0 ? (
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {selectedEnquiryOrders.map((order) => (
                                  <div
                                    key={order.order_id}
                                    className="flex flex-wrap gap-x-4 gap-y-1 rounded border border-border/40 bg-background/60 px-2 py-1"
                                  >
                                    <span>Order #{order.order_id}</span>
                                    <span>Quote #{order.quote_id}</span>
                                    <span>Status: {order.production_status}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No confirmed orders linked yet.
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                              Delivery Tracking
                            </p>
                            {selectedEnquiryShipments.length > 0 ? (
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {selectedEnquiryShipments.map((shipment) => (
                                  <div
                                    key={shipment.shipment_id}
                                    className="flex flex-wrap gap-x-4 gap-y-1 rounded border border-border/40 bg-background/60 px-2 py-1"
                                  >
                                    <span>Shipment #{shipment.shipment_id}</span>
                                    <span>Order #{shipment.order_id}</span>
                                    <span>Status: {shipment.status}</span>
                                    <span>
                                      Shipped: {shipment.shipped_date ?? "Pending"}
                                    </span>
                                    <span>Carrier: {shipment.carrier}</span>
                                    <span>Tracking: {shipment.tracking_number}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No shipment records for this enquiry yet.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {enquiryDetailsError && (
                        <p className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                          {enquiryDetailsError}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "orders" && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Confirmed Orders</CardTitle>
                  <CardDescription>
                    Manage and track all customer orders.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <TableSkeleton cols={4} />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Quote ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.length > 0 ? (
                            orders.map((order) => (
                              <TableRow key={order.order_id}>
                                <TableCell className="font-medium">
                                  {order.order_id}
                                </TableCell>
                                <TableCell>{order.quote_id}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="border-primary/20 bg-primary/5 text-primary"
                                  >
                                    {order.production_status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {order.production_status.includes(
                                    "Ready for Billing"
                                  ) && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleIssueInvoice(order.order_id)
                                      }
                                    >
                                      Issue Invoice
                                    </Button>
                                  )}
                                  {order.production_status.includes("Invoiced") && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleDispatch(order.order_id)}
                                    >
                                      Dispatch
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No orders found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "production" && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Production Control</CardTitle>
                  <CardDescription>
                    Monitor ongoing manufacturing tasks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <TableSkeleton cols={5} />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead>Task ID</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {optimisticTasks.length > 0 ? (
                            optimisticTasks.map((task) => (
                              <TableRow key={task.id}>
                                <TableCell className="font-medium">
                                  {task.id}
                                </TableCell>
                                <TableCell>{task.order_id}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      task.status === "In Progress"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {task.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-full max-w-[100px] rounded-full bg-secondary">
                                      <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${task.progress || 0}%` }}
                                      />
                                    </div>
                                    <span className="text-xs">
                                      {task.progress || 0}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {task.status === "Scheduled" && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateTaskStatus(
                                          task.id,
                                          "In Progress"
                                        )
                                      }
                                    >
                                      Start
                                    </Button>
                                  )}
                                  {task.status === "In Progress" && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateTaskStatus(task.id, "Completed")
                                      }
                                    >
                                      Complete
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No production tasks found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "quality" && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Quality Assurance</CardTitle>
                  <CardDescription>
                    Inspect completed tasks and approve for shipping.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <TableSkeleton cols={4} />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead>Task ID</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.filter((t) => t.status === "Completed").length > 0 ? (
                            tasks
                              .filter((t) => t.status === "Completed")
                              .map((task) => (
                                <TableRow key={task.id}>
                                  <TableCell className="font-medium">
                                    {task.id}
                                  </TableCell>
                                  <TableCell>{task.order_id}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      Awaiting Inspection
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="flex justify-end gap-2 text-right">
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() =>
                                        handleQualitySubmit(
                                          Number(task.id),
                                          "Approved"
                                        )
                                      }
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleQualitySubmit(
                                          Number(task.id),
                                          "Rejected"
                                        )
                                      }
                                    >
                                      Reject
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No tasks pending inspection.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "logistics" && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Shipment Tracking</CardTitle>
                  <CardDescription>
                    Monitor dispatch and delivery progress.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {shipmentsLoading ? (
                    <TableSkeleton cols={5} />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead>Shipment ID</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Carrier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Tracking</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shipments.length > 0 ? (
                            shipments.map((s) => (
                              <TableRow key={s.shipment_id}>
                                <TableCell className="font-medium">
                                  {s.shipment_id}
                                </TableCell>
                                <TableCell>{s.order_id}</TableCell>
                                <TableCell>{s.carrier}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{s.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  {s.tracking_number}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No shipments found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "inventory" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Materials</CardTitle>
                    <CardDescription>Raw material stock.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {inventoryLoading ? (
                      <TableSkeleton cols={2} />
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-border/50">
                        <Table>
                          <TableBody>
                            {inventory.materials.length > 0 ? (
                              inventory.materials.map((m) => (
                                <TableRow key={m.id}>
                                  <TableCell className="text-xs font-medium">
                                    {m.name}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge
                                      variant={
                                        m.qty < 50 ? "destructive" : "outline"
                                      }
                                      className="text-[10px]"
                                    >
                                      {m.qty}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                  Empty
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Machines</CardTitle>
                    <CardDescription>Equipment status.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {inventoryLoading ? (
                      <TableSkeleton cols={2} />
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-border/50">
                        <Table>
                          <TableBody>
                            {inventory.machines.length > 0 ? (
                              inventory.machines.map((mac) => (
                                <TableRow key={mac.id}>
                                  <TableCell className="text-xs font-medium">
                                    {mac.name}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge
                                      variant={
                                        mac.status === "Operational" || mac.status === "Active"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-[10px]"
                                    >
                                      {mac.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                  Empty
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Finished Goods</CardTitle>
                    <CardDescription>Completed products.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {inventoryLoading ? (
                      <TableSkeleton cols={2} />
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-border/50">
                        <Table>
                          <TableBody>
                            {inventory.finished_goods.length > 0 ? (
                              inventory.finished_goods.map((fg) => (
                                <TableRow key={fg.id}>
                                  <TableCell className="text-xs font-medium">
                                    {fg.part_number}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {fg.qty} units
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                  Empty
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "forecasting" && (
              <div className="flex flex-col gap-8">
                {/* Machine Maintenance */}
                <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Machine Maintenance Tracker</CardTitle>
                        <CardDescription>
                          Predictive maintenance based on production usage.
                        </CardDescription>
                      </div>
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {maintenanceLoading ? (
                      <TableSkeleton cols={6} />
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-border/50">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead>Machine</TableHead>
                              <TableHead>Usage (Springs)</TableHead>
                              <TableHead>Capacity</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Next Service (Est)</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {maintenance.length > 0 ? (
                              maintenance.map((m) => (
                                <TableRow key={m.machine_id}>
                                  <TableCell>
                                    <div className="font-medium">{m.name}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {m.type}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {m.usage_since_maintenance.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex w-full flex-col gap-1">
                                      <div className="h-1.5 w-full rounded-full bg-secondary">
                                        <div
                                          className={cn(
                                            "h-full rounded-full",
                                            m.severity === "critical"
                                              ? "bg-destructive"
                                              : m.severity === "warning"
                                              ? "bg-yellow-500"
                                              : "bg-emerald-500"
                                          )}
                                          style={{
                                            width: `${m.utilization_percent}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-muted-foreground">
                                        {m.utilization_percent}% utilized
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        m.severity === "critical"
                                          ? "destructive"
                                          : m.severity === "warning"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className={cn(
                                        "text-[10px] capitalize",
                                        m.severity === "warning" &&
                                          "border-yellow-500/50 bg-yellow-500/10 text-yellow-600"
                                      )}
                                    >
                                      {m.severity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {m.scheduled_maintenance_at
                                      ? new Date(
                                          m.scheduled_maintenance_at
                                        ).toLocaleDateString()
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px]"
                                      onClick={() =>
                                        handleMaintenanceRecord(m.machine_id)
                                      }
                                    >
                                      Record Service
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                  No machine data available.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Raw Material Forecast */}
                <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Raw Material Forecasting</CardTitle>
                        <CardDescription>
                          Projected requirements for the next{" "}
                          {forecast?.parameters.horizon_days ?? 30} days.
                        </CardDescription>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {forecastLoading ? (
                      <TableSkeleton cols={6} />
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-border/50">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Stock (kg)</TableHead>
                              <TableHead>Required (kg)</TableHead>
                              <TableHead>Projected (kg)</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Recommendation
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {forecast?.materials && forecast.materials.length > 0 ? (
                              forecast.materials.map((mat) => (
                                <TableRow key={mat.material_id}>
                                  <TableCell className="font-medium">
                                    {mat.material_name}
                                  </TableCell>
                                  <TableCell>{mat.current_stock_kg}</TableCell>
                                  <TableCell>{mat.forecast_required_kg}</TableCell>
                                  <TableCell
                                    className={cn(
                                      mat.projected_stock_kg < 0 &&
                                        "font-bold text-destructive"
                                    )}
                                  >
                                    {mat.projected_stock_kg}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        mat.status === "critical"
                                          ? "destructive"
                                          : "outline"
                                      }
                                      className={cn(
                                        "text-[10px] capitalize",
                                        mat.status === "warning" &&
                                          "border-yellow-500/50 bg-yellow-500/10 text-yellow-600"
                                      )}
                                    >
                                      {mat.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {mat.recommended_purchase_kg > 0 ? (
                                      <span className="text-xs font-semibold text-primary">
                                        Buy {mat.recommended_purchase_kg} kg
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        Stock Sufficient
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                  No forecast data available.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

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
  type FinancialAnalytics,
  type ProductionAnalytics,
} from "@/lib/actions/analytics";
import { getOrders, type Order } from "@/lib/actions/orders";
import {
  getShipments,
  dispatchShipment,
  type Shipment,
} from "@/lib/actions/shipments";
import { createQuotation } from "@/lib/actions/quotations";
import { issueInvoice } from "@/lib/actions/invoices";
import { getMachines, type Machine } from "@/lib/actions/machines";
import { getMaterials, type Material } from "@/lib/actions/materials";
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

// --- Types ---

interface AnalyticsState {
  financial: FinancialAnalytics | null;
  production: ProductionAnalytics | null;
}

const TABS = [
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "enquiries", label: "Enquiries", icon: FileText },
  { id: "orders", label: "Orders", icon: Package },
  { id: "production", label: "Production", icon: ClipboardList },
  { id: "quality", label: "Quality", icon: CheckCircle },
  { id: "logistics", label: "Logistics", icon: Truck },
  { id: "inventory", label: "Inventory", icon: Layers },
];

// --- Action functions for useActionState ---

async function fetchAnalytics(): Promise<AnalyticsState | null> {
  const [financial, production] = await Promise.allSettled([
    getFinancialAnalytics(),
    getProductionAnalytics(),
  ]);
  return {
    financial: financial.status === "fulfilled" ? financial.value : null,
    production: production.status === "fulfilled" ? production.value : null,
  };
}

async function fetchEnquiries(): Promise<Enquiry[]> {
  return getEnquiries();
}

async function fetchTasks(): Promise<ProductionTask[]> {
  return getTasks();
}

async function fetchOrders(): Promise<Order[]> {
  return getOrders();
}

async function fetchShipments(): Promise<Shipment[]> {
  return getShipments();
}

export function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");

  // useActionState for each data source
  const [analytics, loadAnalytics, analyticsLoading] = useActionState(
    fetchAnalytics,
    null
  );
  const [enquiries, loadEnquiries, enquiriesLoading] = useActionState(
    fetchEnquiries,
    []
  );
  const [tasks, loadTasks, tasksLoading] = useActionState(fetchTasks, []);
  const [orders, loadOrders, ordersLoading] = useActionState(fetchOrders, []);
  const [shipments, loadShipments, shipmentsLoading] = useActionState(
    fetchShipments,
    []
  );
  const [inventory, loadInventory, inventoryLoading] = useActionState(
    getInventorySummary,
    { machines: [], materials: [], finished_goods: [] }
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
      startTransition(() => {
        loadTasks();
      });
    } catch (err) {
      console.error("Failed to update task", err);
      startTransition(() => {
        loadTasks();
      });
    }
  };

  const handleFeasibilityCheck = async (enquiryId: number) => {
    try {
      await runFeasibilityCheck(enquiryId);
      startTransition(() => {
        loadEnquiries();
      });
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
      startTransition(() => {
        loadEnquiries();
      });
    } catch (err) {
      console.error("Failed to generate quote", err);
    }
  };

  const handleQualitySubmit = async (taskId: number, result: string) => {
    try {
      await createQualityReport(taskId, { inspector: "Spring Master", result });
      startTransition(() => {
        loadTasks();
        loadOrders();
      });
    } catch (err) {
      console.error("Quality report submission failed", err);
    }
  };

  const handleIssueInvoice = async (orderId: number) => {
    try {
      await issueInvoice(orderId);
      startTransition(() => {
        loadOrders();
      });
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
      startTransition(() => {
        loadOrders();
        loadShipments();
      });
    } catch (err) {
      console.error("Dispatch failed", err);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    startTransition(() => {
      if (activeTab === "analytics") loadAnalytics();
      else if (activeTab === "enquiries") loadEnquiries();
      else if (activeTab === "production" || activeTab === "quality")
        loadTasks();
      else if (activeTab === "orders") loadOrders();
      else if (activeTab === "logistics") loadShipments();
      else if (activeTab === "inventory") loadInventory();
    });
  }, [activeTab]);

  const isLoading =
    analyticsLoading ||
    enquiriesLoading ||
    tasksLoading ||
    ordersLoading ||
    shipmentsLoading ||
    inventoryLoading;

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
              value: orders.length,
              icon: Package,
              trend: "Across all stages",
            },
            {
              title: "Tasks In Progress",
              value: tasks.filter((t) => t.status === "In Progress").length,
              icon: ClipboardList,
              trend: `${tasks.filter((t) => t.status === "Completed").length} completed today`,
            },
            {
              title: "Pending QC",
              value: tasks.filter((t) => t.status === "Completed").length,
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
                        {enquiries.map((enq) => (
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
                              <Button size="sm" variant="ghost">
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                        {orders.map((order) => (
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                        {optimisticTasks.map((task) => (
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                        {tasks
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
                          ))}
                        {tasks.filter((t) => t.status === "Completed")
                          .length === 0 && (
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
                        {shipments.map((s) => (
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableBody>
                          {inventory.materials.map((m) => (
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
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Machines</CardTitle>
                    <CardDescription>Equipment status.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableBody>
                          {inventory.machines.map((mac) => (
                            <TableRow key={mac.id}>
                              <TableCell className="text-xs font-medium">
                                {mac.name}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant={
                                    mac.status === "Operational"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-[10px]"
                                >
                                  {mac.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Finished Goods</CardTitle>
                    <CardDescription>Completed products.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableBody>
                          {inventory.finished_goods.map((fg) => (
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
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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

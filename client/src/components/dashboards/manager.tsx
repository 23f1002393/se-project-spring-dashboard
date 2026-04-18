import { useState, useEffect, useOptimistic, useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  FileText,
  CheckCircle,
  Truck,
  ClipboardList,
  TrendingUp,
  Clock,
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
import { getTasks, updateTaskStatus, type ProductionTask } from "@/lib/actions/tasks";
import {
  getFinancialAnalytics,
  getProductionAnalytics,
  type FinancialAnalytics,
  type ProductionAnalytics,
} from "@/lib/actions/analytics";

// --- Skeleton Components ---

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton({ cols, rows = 3 }: { cols: number; rows?: number }) {
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

const TABS = [
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "enquiries", label: "Enquiries & Quotes", icon: FileText },
  { id: "production", label: "Production", icon: ClipboardList },
  { id: "quality", label: "Quality Control", icon: CheckCircle },
  { id: "logistics", label: "Shipments", icon: Truck },
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

export function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");

  // useActionState for each data source
  const [analytics, loadAnalytics, analyticsLoading] = useActionState(fetchAnalytics, null);
  const [enquiries, loadEnquiries, enquiriesLoading] = useActionState(fetchEnquiries, []);
  const [tasks, loadTasks, tasksLoading] = useActionState(fetchTasks, []);

  // Optimistic task updates (e.g. marking a task status)
  const [optimisticTasks, setOptimisticTask] = useOptimistic(
    tasks,
    (currentTasks: ProductionTask[], updatedTask: ProductionTask) =>
      currentTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
  );

  const handleUpdateTaskStatus = async (taskId: number | string, newStatus: string) => {
    const taskToUpdate = optimisticTasks.find((t) => t.id === taskId);
    if (taskToUpdate) {
      setOptimisticTask({ ...taskToUpdate, status: newStatus });
    }
    try {
      await updateTaskStatus(Number(taskId), newStatus);
      // Reload tasks to get server state
      loadTasks();
    } catch (err) {
      console.error("Failed to update task", err);
      loadTasks(); // rollback by refetching
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === "analytics") loadAnalytics();
    else if (activeTab === "enquiries") loadEnquiries();
    else if (activeTab === "production") loadTasks();
  }, [activeTab, loadAnalytics, loadEnquiries, loadTasks]);

  const isLoading =
    (activeTab === "analytics" && analyticsLoading) ||
    (activeTab === "enquiries" && enquiriesLoading) ||
    (activeTab === "production" && tasksLoading);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 font-sans md:p-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Manager Overview
          </h1>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
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
              title: "Active Enquiries",
              value: analytics.production?.total_tasks ?? "—",
              icon: FileText,
              trend: "Total tracked tasks",
            },
            {
              title: "Ongoing Production",
              value: analytics.production
                ? `${analytics.production.in_progress_tasks} tasks`
                : "—",
              icon: ClipboardList,
              trend: `${analytics.production?.completed_tasks ?? 0} completed`,
            },
            {
              title: "Pending QC",
              value: analytics.production
                ? `${analytics.production.pending_qc} batches`
                : "—",
              icon: CheckCircle,
              trend: "Awaiting inspection",
            },
            {
              title: "Revenue (MTD)",
              value: analytics.financial?.total_revenue !== undefined
                ? `$${analytics.financial.total_revenue.toLocaleString()}`
                : "—",
              icon: TrendingUp,
              trend: analytics.financial?.total_profit !== undefined
                ? `Profit: $${analytics.financial.total_profit.toLocaleString()}`
                : "",
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
      <div className="scrollbar-hide flex overflow-x-auto border-b border-border/50 pb-[1px]">
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
                  {analyticsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-48" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                      </div>
                    </div>
                  ) : analytics?.financial ? (
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                      {[
                        { 
                          label: "Revenue", 
                          value: analytics.financial.total_revenue !== undefined 
                            ? `$${analytics.financial.total_revenue.toLocaleString()}` 
                            : "—" 
                        },
                        { 
                          label: "Cost", 
                          value: analytics.financial.total_cost !== undefined 
                            ? `$${analytics.financial.total_cost.toLocaleString()}` 
                            : "—" 
                        },
                        { 
                          label: "Profit", 
                          value: analytics.financial.total_profit !== undefined 
                            ? `$${analytics.financial.total_profit.toLocaleString()}` 
                            : "—" 
                        },
                        { 
                          label: "Invoices", 
                          value: analytics.financial.invoices_count ?? 0 
                        },
                      ].map((item, i) => (
                        <div key={i} className="rounded-xl border border-border/40 bg-background/80 p-4 text-center">
                          <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                          <p className="mt-1 text-xl font-semibold">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
                      <BarChart className="h-4 w-4" /> No analytics data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "enquiries" && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Recent Enquiries</CardTitle>
                  <CardDescription>
                    Manage customer requests and generate quotations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {enquiriesLoading ? (
                    <TableSkeleton cols={6} />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="font-medium">ID</TableHead>
                            <TableHead className="font-medium">Customer</TableHead>
                            <TableHead className="font-medium">Product Spec</TableHead>
                            <TableHead className="font-medium">Date</TableHead>
                            <TableHead className="font-medium">Status</TableHead>
                            <TableHead className="text-right font-medium">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enquiries.map((enq) => (
                            <TableRow
                              key={enq.id}
                              className="transition-colors hover:bg-muted/20"
                            >
                              <TableCell className="font-medium">{enq.id}</TableCell>
                              <TableCell>{enq.customer_id}</TableCell>
                              <TableCell>{enq.product_spec}</TableCell>
                              <TableCell>{enq.created_at}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={enq.status === "Pending Quote" ? "secondary" : "outline"}
                                  className="bg-background shadow-sm"
                                >
                                  {enq.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="hover:bg-primary/10 hover:text-primary"
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {enquiries.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No enquiries found.
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
                  <CardTitle>Production Planning & Execution</CardTitle>
                  <CardDescription>
                    Track manufacturing tasks and machine allocation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <TableSkeleton cols={6} />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="font-medium">Task ID</TableHead>
                            <TableHead className="font-medium">Order</TableHead>
                            <TableHead className="font-medium">Machine</TableHead>
                            <TableHead className="font-medium">Status</TableHead>
                            <TableHead className="font-medium">Progress</TableHead>
                            <TableHead className="text-right font-medium">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {optimisticTasks.map((task) => (
                            <TableRow
                              key={task.id}
                              className="transition-colors hover:bg-muted/20"
                            >
                              <TableCell className="font-medium">{task.id}</TableCell>
                              <TableCell>{task.order_id}</TableCell>
                              <TableCell>{task.machine_id}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={task.status === "In Progress" ? "default" : task.status === "Completed" ? "outline" : "secondary"}
                                  className={task.status === "In Progress" ? "shadow-sm" : "bg-background shadow-sm"}
                                >
                                  {task.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium">{task.progress || 0}%</span>
                                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary/50">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${task.progress || 0}%` }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                      className="h-full rounded-full bg-primary"
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {task.status !== "Completed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateTaskStatus(task.id, task.status === "Scheduled" ? "In Progress" : "Completed")}
                                    className="h-8 px-2 text-xs"
                                  >
                                    {task.status === "Scheduled" ? "Start" : "Complete"}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {optimisticTasks.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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

            {(activeTab === "quality" || activeTab === "logistics") && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>
                    {TABS.find((t) => t.id === activeTab)?.label}
                  </CardTitle>
                  <CardDescription>Module coming soon.</CardDescription>
                </CardHeader>
                <CardContent className="flex h-32 items-center justify-center border-t border-border/40 bg-muted/10">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Work in progress
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

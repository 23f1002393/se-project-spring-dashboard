import {
  type FormEvent,
  useState,
  useEffect,
  useOptimistic,
  useActionState,
  startTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  PackageSearch,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  PackageCheck,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createEnquiry, getEnquiries, updateEnquiry } from "@/lib/actions/enquiries";
import { getTasks } from "@/lib/actions/tasks";
import { acceptQuotation } from "@/lib/actions/quotations";
import { createOrder } from "@/lib/actions/orders";
import { getShipments, updateDelivery, type Shipment } from "@/lib/actions/shipments";
import { useAppSelector } from "@/lib/hooks";

// --- Skeleton Components ---

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12" />
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

interface DisplayQuotation {
  id: number | string;
  product: string;
  amount: string;
  date: string;
  status: string;
}

interface DisplayOrder {
  id: number | string;
  orderId: number | string;
  product: string;
  status: string;
  expectedDelivery: string;
}

const TABS = [
  { id: "quotations", label: "Quotations", icon: FileText },
  { id: "orders", label: "Active Orders", icon: PackageSearch },
  { id: "deliveries", label: "Deliveries", icon: Truck },
];

// --- Action functions for useActionState ---

async function fetchQuotations(
  _prev: DisplayQuotation[]
): Promise<DisplayQuotation[]> {
  const enquiries = await getEnquiries();
  return enquiries.map((e) => ({
    id: e.id,
    product: e.product_spec,
    amount: "—",
    date: e.created_at,
    status: e.status,
  }));
}

async function fetchOrders(_prev: DisplayOrder[]): Promise<DisplayOrder[]> {
  const tasks = await getTasks();
  return tasks.map((t) => ({
    id: t.id, // Unique Task ID
    orderId: t.order_id,
    product: `Order #${t.order_id}`,
    status: t.status,
    expectedDelivery: "—",
  }));
}

async function fetchShipments(): Promise<Shipment[]> {
  return getShipments();
}

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("quotations");
  const user = useAppSelector((state) => state.user.user) as
    | { user_id?: number; name?: string; role?: string }
    | null;

  const [quotationProductSpec, setQuotationProductSpec] = useState("");
  const [quotationQuantity, setQuotationQuantity] = useState("");
  const [quotationSubmitLoading, setQuotationSubmitLoading] = useState(false);
  const [quotationSubmitError, setQuotationSubmitError] = useState<string | null>(null);
  const [quotationSubmitSuccess, setQuotationSubmitSuccess] = useState<string | null>(null);

  const [newOrderQuoteId, setNewOrderQuoteId] = useState("");
  const [newOrderSpringId, setNewOrderSpringId] = useState("");
  const [createOrderLoading, setCreateOrderLoading] = useState(false);
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);
  const [createOrderSuccess, setCreateOrderSuccess] = useState<string | null>(null);

  // useActionState for each data source
  const [quotations, loadQuotations, quotationsLoading] = useActionState(
    fetchQuotations,
    []
  );
  const [orders, loadOrders, ordersLoading] = useActionState(fetchOrders, []);
  const [deliveries, loadDeliveries, deliveriesLoading] = useActionState(fetchShipments, []);

  // Optimistic quotation updates for approve/reject
  const [optimisticQuotations, setOptimisticQuotation] = useOptimistic(
    quotations,
    (current: DisplayQuotation[], updated: DisplayQuotation) =>
      current.map((q) => (q.id === updated.id ? updated : q))
  );

  const handleApprove = async (quoteId: number | string) => {
    const qt = optimisticQuotations.find((q) => q.id === quoteId);
    if (qt) {
      startTransition(() => {
        setOptimisticQuotation({ ...qt, status: "Approved" });
      });
    }
    try {
      await updateEnquiry(quoteId, { status: "Order Confirmed" });
      try {
        await acceptQuotation(Number(quoteId));
      } catch (e) {
        console.warn("acceptQuotation failed", e);
      }
      startTransition(() => { loadQuotations(); });
    } catch (err) {
      console.error("Failed to approve", err);
      startTransition(() => { loadQuotations(); });
    }
  };

  const handleReject = async (quoteId: number | string) => {
    const qt = optimisticQuotations.find((q) => q.id === quoteId);
    if (qt) {
      startTransition(() => {
        setOptimisticQuotation({ ...qt, status: "Rejected" });
      });
    }
    try {
      await updateEnquiry(quoteId, { 
        status: "Rejected",
        rejection_reason: "Customer rejected the quotation." 
      });
      startTransition(() => { loadQuotations(); });
    } catch (err) {
      console.error("Failed to reject", err);
      startTransition(() => { loadQuotations(); });
    }
  };

  const handleConfirmDelivery = async (shipmentId: number, status: string) => {
    try {
      await updateDelivery(shipmentId, { delivery_status: status, customer_feedback: "Goods received in good condition." });
      loadDeliveries();
    } catch (err) {
      console.error("Failed to confirm delivery", err);
    }
  };

  const handleCreateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateOrderError(null);
    setCreateOrderSuccess(null);

    const quoteId = Number(newOrderQuoteId);
    const springId = Number(newOrderSpringId);

    if (!Number.isInteger(quoteId) || quoteId <= 0) {
      setCreateOrderError("Please enter a valid Quote ID.");
      return;
    }
    if (!Number.isInteger(springId) || springId <= 0) {
      setCreateOrderError("Please enter a valid Spring ID.");
      return;
    }

    setCreateOrderLoading(true);
    try {
      const created = await createOrder({
        quote_id: quoteId,
        spring_id: springId,
        production_status: "Pending",
      });
      setCreateOrderSuccess(`Order #${created.order_id} created successfully.`);
      setNewOrderQuoteId("");
      setNewOrderSpringId("");
      startTransition(() => {
        loadOrders();
      });
    } catch (err) {
      setCreateOrderError(
        err instanceof Error ? err.message : "Failed to create order."
      );
    } finally {
      setCreateOrderLoading(false);
    }
  };

  const handleRequestQuotation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuotationSubmitError(null);
    setQuotationSubmitSuccess(null);

    if (!user?.user_id) {
      setQuotationSubmitError("Please log in again to submit a quotation request.");
      return;
    }

    if (!quotationProductSpec.trim()) {
      setQuotationSubmitError("Product specification is required.");
      return;
    }

    const quantity = Number(quotationQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setQuotationSubmitError("Please enter a valid quantity.");
      return;
    }

    setQuotationSubmitLoading(true);
    try {
      const created = await createEnquiry({
        customer_id: user.user_id,
        product_spec: quotationProductSpec.trim(),
        quantity,
      });

      const enquiryId = (created as { enquiry_id?: number }).enquiry_id;
      setQuotationSubmitSuccess(
        enquiryId
          ? `Quotation request submitted as Enquiry #${enquiryId}.`
          : "Quotation request submitted successfully."
      );
      setQuotationProductSpec("");
      setQuotationQuantity("");
      startTransition(() => {
        loadQuotations();
      });
    } catch (err) {
      setQuotationSubmitError(
        err instanceof Error ? err.message : "Failed to submit quotation request."
      );
    } finally {
      setQuotationSubmitLoading(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    startTransition(() => {
      if (activeTab === "quotations") loadQuotations();
      else if (activeTab === "orders") loadOrders();
      else if (activeTab === "deliveries") loadDeliveries();
    });
  }, [activeTab]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 font-sans md:p-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Customer Portal
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your orders, review quotations, and monitor shipments.
        </p>
      </div>

      {/* Top Level Metrics */}
      {quotationsLoading ? (
        <MetricsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              title: "Pending Quotations",
              value: optimisticQuotations.filter(
                (q) => q.status !== "Approved" && q.status !== "Rejected"
              ).length,
              icon: FileText,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              title: "Active Orders",
              value: orders.length,
              icon: PackageSearch,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              title: "In Transit",
              value: deliveries.filter((d) => d.status === "Dispatch" || d.status === "In Transit").length,
              icon: Truck,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
          ].map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, type: "spring" }}
            >
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl transition-all hover:bg-background/80 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      metric.bg
                    )}
                  >
                    <metric.icon className={cn("h-4 w-4", metric.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{metric.value}</div>
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
                  layoutId="customer-active-tab"
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
            initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 10, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeTab === "quotations" && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Your Quotations</CardTitle>
                  <CardDescription>
                    Review and approve manufacturing quotes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {quotationsLoading ? (
                    <TableSkeleton cols={6} />
                  ) : (
                    <div className="space-y-6">
                      <div className="overflow-hidden rounded-lg border border-border/50">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead className="font-medium">Quote ID</TableHead>
                              <TableHead className="font-medium">Product</TableHead>
                              <TableHead className="font-medium">Amount</TableHead>
                              <TableHead className="font-medium">Date</TableHead>
                              <TableHead className="font-medium">Status</TableHead>
                              <TableHead className="text-right font-medium">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {optimisticQuotations.map((qt) => (
                              <TableRow key={qt.id} className="transition-colors hover:bg-muted/20">
                                <TableCell className="font-medium">{qt.id}</TableCell>
                                <TableCell>{qt.product}</TableCell>
                                <TableCell>{qt.amount}</TableCell>
                                <TableCell>{qt.date}</TableCell>
                                <TableCell>
                                  <Badge variant={qt.status === "Approved" ? "default" : qt.status === "Rejected" ? "destructive" : "secondary"}>
                                    {qt.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {qt.status === "Quoted" && (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => handleApprove(qt.id)}>
                                        <CheckCircle className="mr-1 h-3 w-3" /> Approve
                                      </Button>
                                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleReject(qt.id)}>
                                        <XCircle className="mr-1 h-3 w-3" /> Reject
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                        <h3 className="text-sm font-semibold">Request New Quotation</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Submit product details for Spring Master review and quotation approval.
                        </p>

                        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleRequestQuotation}>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="quotation-product-spec">Product Specification</Label>
                            <Input
                              id="quotation-product-spec"
                              type="text"
                              value={quotationProductSpec}
                              onChange={(e) => setQuotationProductSpec(e.target.value)}
                              placeholder="Compression spring, SS304, 2.5mm wire"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="quotation-quantity">Quantity</Label>
                            <Input
                              id="quotation-quantity"
                              type="number"
                              min={1}
                              value={quotationQuantity}
                              onChange={(e) => setQuotationQuantity(e.target.value)}
                              placeholder="e.g. 500"
                              required
                            />
                          </div>

                          <div className="flex items-end justify-start md:justify-end">
                            <Button type="submit" disabled={quotationSubmitLoading}>
                              {quotationSubmitLoading ? "Submitting..." : "Submit Request"}
                            </Button>
                          </div>

                          <div className="md:col-span-2 text-sm">
                            {quotationSubmitError && (
                              <p className="text-destructive">{quotationSubmitError}</p>
                            )}
                            {quotationSubmitSuccess && (
                              <p className="text-emerald-600">{quotationSubmitSuccess}</p>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "orders" && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Active Orders</CardTitle>
                  <CardDescription>Track the production status of your approved orders.</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <TableSkeleton cols={4} />
                  ) : (
                    <div className="space-y-6">
                      <div className="overflow-hidden rounded-lg border border-border/50">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead className="font-medium">Order ID</TableHead>
                              <TableHead className="font-medium">Product</TableHead>
                              <TableHead className="font-medium">Status</TableHead>
                              <TableHead className="text-right font-medium">Expected Delivery</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => (
                              <TableRow key={order.id} className="transition-colors hover:bg-muted/20">
                                <TableCell className="font-medium">{order.orderId}</TableCell>
                                <TableCell>{order.product}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                    <Clock className="mr-1 h-3 w-3" /> {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">{order.expectedDelivery}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                        <h3 className="text-sm font-semibold">Create New Order</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Enter an existing quote and spring to create a production order.
                        </p>

                        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleCreateOrder}>
                          <div className="space-y-1.5">
                            <Label htmlFor="new-order-quote-id">Quote ID</Label>
                            <Input
                              id="new-order-quote-id"
                              type="number"
                              min={1}
                              value={newOrderQuoteId}
                              onChange={(e) => setNewOrderQuoteId(e.target.value)}
                              placeholder="e.g. 1"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="new-order-spring-id">Spring ID</Label>
                            <Input
                              id="new-order-spring-id"
                              type="number"
                              min={1}
                              value={newOrderSpringId}
                              onChange={(e) => setNewOrderSpringId(e.target.value)}
                              placeholder="e.g. 1"
                              required
                            />
                          </div>

                          <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm">
                              {createOrderError && (
                                <p className="text-destructive">{createOrderError}</p>
                              )}
                              {createOrderSuccess && (
                                <p className="text-emerald-600">{createOrderSuccess}</p>
                              )}
                            </div>

                            <Button type="submit" disabled={createOrderLoading}>
                              {createOrderLoading ? "Creating..." : "Create Order"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "deliveries" && (
              <Card className="border-border/40 bg-background/60 shadow-sm backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Deliveries & Shipments</CardTitle>
                  <CardDescription>Track your shipments and confirm receipt.</CardDescription>
                </CardHeader>
                <CardContent>
                  {deliveriesLoading ? (
                    <TableSkeleton cols={5} />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="font-medium">Shipment ID</TableHead>
                            <TableHead className="font-medium">Order ID</TableHead>
                            <TableHead className="font-medium">Status</TableHead>
                            <TableHead className="text-right font-medium">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deliveries.map((delivery) => (
                            <TableRow key={delivery.shipment_id} className="transition-colors hover:bg-muted/20">
                              <TableCell className="font-medium">{delivery.shipment_id}</TableCell>
                              <TableCell>{delivery.order_id}</TableCell>
                              <TableCell>
                                <Badge variant={delivery.status === "Delivered & Accepted" ? "default" : "secondary"}>
                                  {delivery.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {delivery.status === "Dispatch" && (
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600" onClick={() => handleConfirmDelivery(Number(delivery.shipment_id), "Delivered & Accepted")}>
                                      <PackageCheck className="mr-1 h-3 w-3" /> Accept
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleConfirmDelivery(Number(delivery.shipment_id), "Rejected")}>
                                      <XCircle className="mr-1 h-3 w-3" /> Reject
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

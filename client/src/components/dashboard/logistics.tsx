import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLogisticsDashboardData } from "@/actions/data";

export default function LogisticsDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchLogisticsDashboardData().then(setData);
  }, []);

  if (!data) return <div className="p-8 animate-pulse text-muted-foreground">Loading Logistics Hub...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold tracking-tight">Logistics Hub</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg shadow-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Orders Ready For Dispatch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{data.orders?.length || 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg shadow-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{data.shipments?.length || 0}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="mt-8 border-border/50">
        <CardHeader>
          <CardTitle>Shipment Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.shipments?.map((ship: any, i: number) => (
              <motion.div
                key={ship.shipment_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-lg">Tracking: {ship.tracking_number}</p>
                  <p className="text-sm text-muted-foreground mt-1">Order #{ship.order_id} &bull; Carrier: {ship.carrier}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${ship.status === 'delivered' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
                  {ship.status.replace("_", " ")}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

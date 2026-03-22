import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSalesDashboardData } from "@/actions/data";

export default function SalesDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchSalesDashboardData().then(setData);
  }, []);

  if (!data) return <div className="p-8 animate-pulse text-muted-foreground">Loading Sales Data...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold tracking-tight">Sales Manager Overview</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Metric Cards with hover micro-interactions */}
        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg shadow-primary/5 border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Enquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{data.enquiries?.length || 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Quotations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{data.quotations?.length || 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{data.orders?.length || 0}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="mt-8 border-border/50 bg-background/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Recent Enquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {data.enquiries?.map((enq: any, i: number) => (
              <motion.li
                key={enq.enquiry_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-semibold">Enquiry #{enq.enquiry_id}</p>
                  <p className="text-sm text-muted-foreground">{enq.details}</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {enq.status}
                </div>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}

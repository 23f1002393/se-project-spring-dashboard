import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAccountsDashboardData } from "@/actions/data";

export default function AccountsDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAccountsDashboardData().then(setData);
  }, []);

  if (!data) return <div className="p-8 animate-pulse text-muted-foreground">Loading Finance Data...</div>;

  const totalRevenue = data.invoices?.filter((i: any) => i.paid).reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
  const pendingRevenue = data.invoices?.filter((i: any) => !i.paid).reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold tracking-tight">Finance & Billing Returns</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg shadow-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg shadow-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-500">${pendingRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="mt-8 border-border/50">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.invoices?.map((inv: any, i: number) => (
              <motion.div
                key={inv.invoice_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-lg">Invoice #{inv.invoice_id}</p>
                  <p className="text-sm text-muted-foreground mt-1">Order: {inv.order_id} &bull; Issued: {new Date(inv.issued_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${inv.amount.toFixed(2)}</p>
                  <div className={`mt-1 px-3 py-1 inline-block rounded-full text-xs font-semibold ${inv.paid ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                    {inv.paid ? 'PAID' : 'UNPAID'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

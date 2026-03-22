import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCustomerDashboardData } from "@/actions/data";

export default function CustomerDashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (user?.user_id) fetchCustomerDashboardData(user.user_id).then(setData);
  }, [user]);

  if (!data) return <div className="p-8 animate-pulse text-muted-foreground">Loading Client Portal...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold tracking-tight">Client Portal: {data.customer?.name}</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Enquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{data.enquiries?.length || 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{data.orders?.length || 0}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="mt-8 border-border/50 bg-background/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Quotations For Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.quotations?.map((quote: any, i: number) => (
              <motion.div
                key={quote.quote_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card"
              >
                <div>
                  <p className="font-semibold text-lg">Quote #{quote.quote_id} <span className="text-sm font-normal text-muted-foreground">v{quote.version_number}</span></p>
                  <p className="text-sm text-muted-foreground mt-1">Enquiry Ref: {quote.enquiry_id} &bull; Delivery: {new Date(quote.est_delivery).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="text-xl font-bold">${quote.price.toFixed(2)}</p>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${quote.is_accepted ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
                    {quote.is_accepted ? 'ACCEPTED' : 'PENDING REVIEW'}
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

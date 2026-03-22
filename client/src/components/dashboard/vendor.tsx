import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchVendorDashboardData } from "@/actions/data";

export default function VendorDashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (user?.user_id) fetchVendorDashboardData(user.user_id).then(setData);
  }, [user]);

  if (!data) return <div className="p-8 animate-pulse text-muted-foreground">Loading Vendor Portal...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold tracking-tight">External Processor Portal</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{data.outsourced_tasks?.length || 0}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="mt-8 border-border/50">
        <CardHeader>
          <CardTitle>Outsourced Production queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.outsourced_tasks?.map((task: any, i: number) => (
              <motion.div
                key={task.task_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-lg">Task #{task.task_id}</p>
                  <p className="text-sm text-muted-foreground mt-1">Scheduled: {new Date(task.scheduled_at).toLocaleDateString()}</p>
                </div>
                <div className="px-4 py-2 rounded-lg text-sm font-bold bg-orange-500/10 text-orange-600 capitalize">
                  {task.status.replace("_", " ")}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

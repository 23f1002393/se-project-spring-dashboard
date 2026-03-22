import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchForemanDashboardData } from "@/actions/data";

export default function ForemanDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchForemanDashboardData().then(setData);
  }, []);

  if (!data) return <div className="p-8 animate-pulse text-muted-foreground">Loading Production Data...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold tracking-tight">Production Floor (Foreman)</h2>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg shadow-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Machines Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {data.machines?.filter((m: any) => m.status === 'active').length || 0}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg shadow-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasks In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">
                {data.production_tasks?.filter((t: any) => t.status === 'in_progress').length || 0}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="mt-8 border-border/50">
        <CardHeader>
          <CardTitle>Active Production Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.production_tasks?.map((task: any, i: number) => (
              <motion.div
                key={task.task_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 4 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-lg">Task #{task.task_id}</p>
                  <p className="text-sm text-muted-foreground mt-1">Order ID: {task.order_id} &bull; Scheduled: {new Date(task.scheduled_at).toLocaleDateString()}</p>
                </div>
                <div className="mt-4 sm:mt-0 px-4 py-2 rounded-lg text-sm font-bold bg-orange-500/10 text-orange-600 capitalize">
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

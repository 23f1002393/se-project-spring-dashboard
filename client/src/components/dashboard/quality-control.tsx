import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchQCDashboardData } from "@/actions/data";

export default function QualityControlDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchQCDashboardData().then(setData);
  }, []);

  if (!data) return <div className="p-8 animate-pulse text-muted-foreground">Loading QC Data...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold tracking-tight">Quality Control</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg shadow-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-500">
                {data.production_tasks?.filter((t: any) => t.status === 'completed').length || 0}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -4 }}>
          <Card className="shadow-lg shadow-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {data.quality_reports?.filter((r: any) => r.result === 'approved').length || 0}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="mt-8 border-border/50">
        <CardHeader>
          <CardTitle>Recent QC Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.quality_reports?.map((rep: any, i: number) => (
              <motion.div
                key={rep.report_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-lg">Report #{rep.report_id} <span className="text-sm text-muted-foreground font-normal ml-2">(Task #{rep.task_id})</span></p>
                  <p className="text-sm text-muted-foreground mt-1">Determined on: {new Date(rep.report_date).toLocaleDateString()}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${rep.result === 'approved' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {rep.result}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

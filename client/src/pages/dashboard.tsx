import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Dashboards
import SalesDashboard from "@/components/dashboard/sales";
import ForemanDashboard from "@/components/dashboard/foreman";
import QualityControlDashboard from "@/components/dashboard/quality-control";
import AccountsDashboard from "@/components/dashboard/accounts";
import CustomerDashboard from "@/components/dashboard/customer";
import VendorDashboard from "@/components/dashboard/vendor";
import LogisticsDashboard from "@/components/dashboard/logistics";

// UI Components
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(rawUser));
  }, [navigate]);

  if (!user) return <div className="p-8">Loading secure session...</div>;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const renderDashboard = () => {
    switch (user.role) {
      case "sales_manager": return <SalesDashboard />;
      case "foreman": return <ForemanDashboard />;
      case "quality_control": return <QualityControlDashboard />;
      case "accounts_officer": return <AccountsDashboard />;
      case "customer": return <CustomerDashboard user={user} />;
      case "external_vendor": return <VendorDashboard user={user} />;
      case "logistics_provider": return <LogisticsDashboard />;
      default: return <div className="p-8">Unauthorized Role</div>;
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-muted/20 pb-16">
      <header className="sticky top-16 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground mr-2">Logged in as</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{user.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold capitalize">
                {user.role.replace("_", " ")}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>Log Out</Button>
        </div>
      </header>

      <motion.main
        key={user.role}
        initial={{ opacity: 0, filter: "blur(4px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.3 }}
        className="container mx-auto p-4 sm:p-8 flex-1"
      >
        {renderDashboard()}
      </motion.main>
    </div>
  );
}

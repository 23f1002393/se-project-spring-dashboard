import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Zap } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearUser } from "@/lib/features/user/userSlice";
import { ModeToggle } from "@/components/mode-toggle";

export default function Navbar() {
  const user = useAppSelector((state) => state.user.user);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(clearUser());
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo / Brand */}
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            SpringPLM
          </span>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          {user ? (
            <>
              <Link to={user.role === "manager" ? "/manager" : "/customer"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>

              <span className="hidden text-sm text-muted-foreground sm:inline-block">
                {user.name}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-border/50 transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="rounded-full px-5 shadow-sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

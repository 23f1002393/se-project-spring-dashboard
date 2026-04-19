import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";

interface ProtectedRouteProps {
  allowedRoles?: ("manager" | "customer")[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = useAppSelector((state) => state.user.user);

  if (!user) {
    // User not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User logged in but doesn't have the required role
    return <Navigate to="/" replace />;
  }

  // User is authorized, render the child routes
  return <Outlet />;
}

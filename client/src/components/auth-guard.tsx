import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";

export default function AuthGuard() {
  const user = useAppSelector((state) => state.user.user);

  if (user) {
    // User already logged in, redirect to their respective dashboard or home
    const redirectPath = user.role === "manager" ? "/manager" : "/customer";
    return <Navigate to={redirectPath} replace />;
  }

  // User is not logged in, allow access to child routes (login/signup)
  return <Outlet />;
}

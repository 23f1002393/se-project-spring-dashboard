import { createBrowserRouter, type RouteObject, Navigate } from "react-router-dom";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ManagerDashboard from "@/pages/manager-dashboard";
import CustomerDashboard from "@/pages/customer-dashboard";
import RootLayout from "@/root-layout";
import ProtectedRoute from "@/components/protected-route";
import AuthGuard from "@/components/auth-guard";

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      {
        element: <AuthGuard />,
        children: [
          { path: "login", Component: Login },
          { path: "signup", Component: Signup },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={["manager"]} />,
        children: [{ path: "manager", Component: ManagerDashboard }],
      },
      {
        element: <ProtectedRoute allowedRoles={["customer"]} />,
        children: [{ path: "customer", Component: CustomerDashboard }],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

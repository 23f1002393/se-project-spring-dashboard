import { createBrowserRouter, type RouteObject } from "react-router-dom";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ManagerDashboard from "@/pages/manager-dashboard";
import CustomerDashboard from "@/pages/customer-dashboard";
import RootLayout from "@/root-layout";

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "/login", Component: Login },
      { path: "/signup", Component: Signup },
      { path: "/manager", Component: ManagerDashboard },
      { path: "/customer", Component: CustomerDashboard },
    ],
  },
];

export const router = createBrowserRouter(routes);

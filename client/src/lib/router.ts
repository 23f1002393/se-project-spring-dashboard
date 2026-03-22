/* react-router-dom */
import { createBrowserRouter, type RouteObject } from "react-router-dom";

/* pages */
import HomePage from "@/pages/home";
import ErrorPage from "@/pages/error";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";

/* layouts */
import RootLayout from "@/layouts/root";

export const routes: RouteObject[] = [
  {
    path: "/",
    children: [
      {
        path: "/",
        index: true,
        Component: HomePage,
      },
      {
        path: "/login",
        Component: LoginPage,
      },
      { path: "/signup", Component: SignupPage },
      { path: "/dashboard", Component: DashboardPage },
    ],
    Component: RootLayout,
    ErrorBoundary: ErrorPage,
  },
];

export const router = createBrowserRouter(routes);

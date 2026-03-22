import * as React from "react";
import { useOutlet, Link, useLocation } from "react-router-dom";
import { Leaf } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

export default function RootLayout() {
  const location = useLocation();
  const element = useOutlet();

  return (
    <div className="min-h-dvh flex flex-col bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Apple-like Glassmorphic Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Leaf className="size-5" />
            </div>
            <span className="font-semibold tracking-tight text-lg">Spring Dashboard</span>
          </Link>

          {/* Centered Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <Link to="/" className={navigationMenuTriggerStyle()}>
                  Home
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-100 gap-3 p-4 md:w-125 md:grid-cols-2 lg:w-150">
                    {[
                      { title: "Sales Lifecycle", href: "/", description: "Manage enquiries to order confirmation seamlessly." },
                      { title: "Production Execution", href: "/", description: "Intelligent planning and real-time floor monitoring." },
                      { title: "Quality Control", href: "/", description: "Standardize inspections and effortlessly manage rework." },
                      { title: "Automated Billing", href: "/", description: "Tie approvals to invoicing with auditable history." }
                    ].map((item) => (
                      <li key={item.title}>
                        <Link
                          to={item.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">{item.title}</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1.5">
                            {item.description}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex rounded-full px-5">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="rounded-full px-5 shadow-sm">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area with View Transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 flex flex-col w-full"
        >
          {element ? React.cloneElement(element, { key: location.pathname }) : null}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

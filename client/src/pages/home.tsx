import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoveRight, ShieldCheck, Factory, BarChart3, Truck, Package, BriefcaseBusiness, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const features = [
    {
      title: "Sales Lifecycle Management",
      description: "Streamline enquiry capture, coordinate quoting with version history, and effortlessly convert approved quotes to confirmed orders.",
      icon: <BriefcaseBusiness className="size-6 text-blue-500" />,
    },
    {
      title: "Intelligent Production Execution",
      description: "Assess machine feasibility instantly, schedule floors, monitor shop-progress in real-time, and pre-empt capacity bottlenecks.",
      icon: <Factory className="size-6 text-orange-500" />,
    },
    {
      title: "Integrated Quality Control",
      description: "Standardize inspection checks, manage rework pipelines, and clear products directly for financial auditing and dispatch.",
      icon: <ShieldCheck className="size-6 text-green-500" />,
    },
    {
      title: "Automated Billing & Auditing",
      description: "Tie quality approvals instantly into invoice generation with granular pricing overrides and complete historical auditability.",
      icon: <BarChart3 className="size-6 text-purple-500" />,
    },
    {
      title: "End-to-End Client Visibility",
      description: "Grant order stakeholders live quotation revisions, real-time tracking updates, and post-delivery insights.",
      icon: <Users className="size-6 text-teal-500" />,
    },
    {
      title: "Seamless Third-Party Workflows",
      description: "Integrate outsourced tasks intelligently with internal schedules while upholding strict required quality standards.",
      icon: <Package className="size-6 text-rose-500" />,
    },
    {
      title: "Agile Logistics Tracking",
      description: "Monitor outbound dispatches, update transit statuses, and manage delivery confirmations or exceptions in real-time.",
      icon: <Truck className="size-6 text-amber-500" />,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="w-full flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden w-full flex items-center justify-center pt-24 pb-32">
        {/* Abstract Background Blur Map */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 size-96 rounded-full bg-primary/10 blur-[100px]" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 size-96 rounded-full bg-blue-500/10 blur-[100px]" 
        />

        <div className="container relative z-10 mx-auto px-4 sm:px-8 text-center max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center rounded-full border border-border/40 bg-muted/50 px-3 py-1 text-sm font-medium mb-8"
          >
            <span className="flex size-2 rounded-full bg-primary mr-2 animate-pulse" />
            Spring Sales Dashboard Version 2.0
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground sm:leading-tight mb-6"
          >
            End-to-end manufacturing & <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              sales efficiency.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
          >
            A unified platform to seamlessly bridge the gap between initial customer enquiries, 
            factory-floor execution, rigorous quality assurance, and automated dispatch.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="rounded-full h-12 px-8 text-base w-full sm:w-auto shadow-lg shadow-primary/20" asChild>
              <Link to="/signup">
                Get Started Now <MoveRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base w-full sm:w-auto bg-background/50 backdrop-blur-sm" asChild>
              <Link to="/login">
                Sign into Dashboard
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-24 bg-muted/30 border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything you need to scale
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Designed from the ground up to handle complex workflows without the complex interface. Access powerful tools crafted for modern production environments.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto auto-rows-fr"
          >
            {features.map((feature, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`group relative flex flex-col items-start p-8 rounded-[2rem] bg-background border border-border/50 shadow-sm transition-colors hover:shadow-md hover:border-primary/20 ${
                  i === 6 ? "md:col-span-2 lg:col-span-1 lg:col-start-2" : ""
                }`}
              >
                <div className="p-3 rounded-2xl bg-muted/50 mb-6 group-hover:bg-primary/5 transition-colors duration-300">
                  <motion.div 
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.icon}
                  </motion.div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed flex-1">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

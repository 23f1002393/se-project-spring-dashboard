import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Factory, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/lib/hooks";

export default function Home() {
  const user = useAppSelector((state) => state.user.user);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background overflow-hidden font-sans">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-8 z-10"
        >
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-full text-sm font-medium border-primary/20 mb-6">
            Introducing PLM System 2.0
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Manufacturing, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              Simplified.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The all-in-one product lifecycle management platform tailored for spring manufacturing. Streamline your production, quality control, and customer relations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to={user ? "/manager" : "/signup"}>
              <Button size="lg" className="rounded-full px-8 h-14 text-base shadow-lg hover:shadow-primary/25 transition-all duration-300">
                {user ? "Go to Dashboard" : "Get Started Now"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {!user && (
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted/50">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      </section>

      {/* Feature Section */}
      <section className="py-24 px-6 relative z-10 bg-muted/30 border-t border-border/50 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight">Everything you need to scale</h2>
            <p className="text-muted-foreground mt-4">Powerful tools designed specifically for industrial workflows.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Production Planning",
                description: "Allocate machines, schedule tasks, and track real-time manufacturing progress with ease.",
                icon: Factory,
              },
              {
                title: "Quality Assurance",
                description: "Record inspection data, approve finished goods, and maintain rigorous audit trails.",
                icon: ShieldCheck,
              },
              {
                title: "Deep Analytics",
                description: "Gain actionable insights into machine utilization, delivery timelines, and financial health.",
                icon: LineChart,
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-background/60 backdrop-blur-xl border border-border/40 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all hover:bg-background/80 group"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

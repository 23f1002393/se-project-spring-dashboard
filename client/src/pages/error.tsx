import { useRouteError, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

export default function ErrorPage() {
  const error = useRouteError() as { statusText?: string; message?: string };
  console.error(error);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-xl p-10 text-center shadow-2xl shadow-destructive/5 flex flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
          <TriangleAlert className="size-8" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-2">Oops! Something went wrong.</h1>
        
        <p className="text-muted-foreground mb-6 text-balance">
          {error.statusText || error.message || "An unexpected error occurred while loading this page."}
        </p>

        <Button asChild className="rounded-full shadow-sm" size="lg">
          <Link to="/">
            Return to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}

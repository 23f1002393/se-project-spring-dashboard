import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex-1 flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm rounded-[2rem] border border-border/40 bg-background/50 backdrop-blur-xl p-8 shadow-2xl shadow-primary/5">
        <div className="mb-6 flex flex-col items-center justify-center space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Enter your credentials to access the secure dashboard.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

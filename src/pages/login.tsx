import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="w-full px-5 md:w-[50%] md:px-0">
      <h1 className="mb-5 text-center text-4xl font-bold">User Login</h1>
      <LoginForm />
    </div>
  );
}

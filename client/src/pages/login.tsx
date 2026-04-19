import { LoginForm } from "@/components/login-form";

export default function Login() {
  return (
    <div className="max-h-screen max-w-screen place-items-center pt-[10%]">
      <LoginForm className="min-w-[50%] md:max-w-[10%]" />
    </div>
  );
}

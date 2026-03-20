import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="w-full px-5 md:w-[50%] md:px-0">
      <h1 className="mb-5 text-center text-4xl font-bold">User Signup</h1>
      <SignupForm />
    </div>
  );
}

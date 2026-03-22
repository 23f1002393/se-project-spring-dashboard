/* components */
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
/* validation schema */
import { loginFormSchema, type LoginFormSchema } from "@/lib/schemas/auth";
/* react-hook-form */
import { useZodResolver } from "@/hooks/use-zod-resolver";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "@/actions/auth";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const resolver = useZodResolver<LoginFormSchema>(loginFormSchema);
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<LoginFormSchema>({
    resolver,
  });

  const navigate = useNavigate();

  const onSubmit: SubmitHandler<LoginFormSchema> = async ({ email, password }) => {
    try {
      const response = await loginUser(email, password);
      
      if (response.success && response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
        // Also simulate storing token if needed
        localStorage.setItem("token", response.token || "");
        navigate("/dashboard");
      } else {
        alert(response.message || "Invalid login");
      }
    } catch (error) {
      alert("An error occurred during login.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="foreman@example.com (or try sales, qc, accounts, etc)"
                  {...register("email")}
                />
                {errors.email && (
                  <div className="text-red-500">{errors.email.message}</div>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <div className="text-red-500">{errors.password.message}</div>
                )}
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                <Button variant="outline" type="button">
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link to="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

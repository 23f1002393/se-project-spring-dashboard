/* components */
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
import { signUpFormSchema, type SignUpFormSchema } from "@/lib/schemas/auth";
/* react-hook-form */
import { useZodResolver } from "@/hooks/use-zod-resolver";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const resolver = useZodResolver<SignUpFormSchema>(signUpFormSchema);
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<SignUpFormSchema>({ resolver });

  const onSubmit: SubmitHandler<SignUpFormSchema> = ({
    name,
    email,
    password,
  }) => {
    alert(JSON.stringify({ name, email, password }));
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name")}
              />
              {errors.name && (
                <FieldDescription className="text-red-500">
                  {errors.name.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
                {errors.email && (
                  <div className="text-red-500">{errors.email.message}</div>
                )}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" {...register("password")} />
              <FieldDescription>
                Must be at least 8 characters long.
                {errors.password && (
                  <div className="text-red-500">{errors.password.message}</div>
                )}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                {...register("confirmPassword")}
              />
              <FieldDescription>
                Please confirm your password.
                {errors.confirmPassword && (
                  <div className="text-red-500">
                    {errors.confirmPassword.message}
                  </div>
                )}
              </FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit">Create Account</Button>
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link to="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

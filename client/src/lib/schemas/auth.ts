/* dependencies */
import { z } from "zod";

const loginFormSchema = z.object(
  {
    email: z.email(),
    password: z.string().min(8),
  },
  { error: "Invalid login form data" }
);
type LoginFormSchema = z.infer<typeof loginFormSchema>;

const signUpFormSchema = z
  .object(
    {
      name: z
        .string()
        .regex(/[^\s]+\s[^\s]+/, {
          error: "Please enter you first and last names",
        })
        .min(1),
      email: z.email(),
      password: z
        .string()
        .regex(/[@\*,\.\%#\^&]/, {
          error: "Password must contain a special character",
        })
        .regex(/[0-9]+/, { error: "Password must contain a digit" })
        .regex(/[a-z]+/, { error: "Password must contain a lower case letter" })
        .regex(/[A-Z]+/, {
          error: "Password must contain an uppercase letter",
        })
        .min(8, { error: "Password must be atleat 8 characters long" }),
      confirmPassword: z.string(),
    },
    { error: "Invalid sign-up form data" }
  )
  .refine(({ password, confirmPassword }) => password == confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match",
  });
type SignUpFormSchema = z.infer<typeof signUpFormSchema>;

/* named exports */
export { loginFormSchema, signUpFormSchema };
/* type exports */
export type { LoginFormSchema, SignUpFormSchema };

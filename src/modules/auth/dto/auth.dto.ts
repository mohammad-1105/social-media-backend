import { z } from "zod";

import { AvailableLoginsEnum } from "@/shared/constants/user.constants.js";

const emailSchema = z.email("Invalid email format");

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, { error: "Username must be at least 3 characters" })
  .max(30, { error: "Username cannot exceed 30 characters" })
  .regex(/^[a-z0-9_]+$/, {
    error: "Only lowercase letters, numbers, underscores allowed",
  });

const passwordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters" })
  .max(64, { error: "Password too long" })
  .regex(/[A-Z]/, { error: "Must include uppercase letter" })
  .regex(/[a-z]/, { error: "Must include lowercase letter" })
  .regex(/[0-9]/, { error: "Must include number" });

// register schema
const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema.optional(),
    loginType: z.enum(AvailableLoginsEnum).default("EMAIL_PASSWORD"),
  })
  .superRefine((data, ctx) => {
    // Enforce conditional password requirement
    if (data.loginType === "EMAIL_PASSWORD" && !data.password) {
      ctx.addIssue({
        code: "custom",
        message: "Password is required for EMAIL_PASSWORD login",
        path: ["password"],
      });
    }
  });

// login schema
const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// change password schema
const changePasswordSchema = z
  .object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    error: "New password must be different from Old password",
    path: ["newPassword"],
  });

// forgot password schema
const forgotPasswordSchema = z.object({
  email: z.email("Invalid Email"),
});

// reset password schema
const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

type RegisterDTO = z.infer<typeof registerSchema>;
type LoginDTO = z.infer<typeof loginSchema>;
type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;

export {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,

  // types export
  type RegisterDTO,
  type LoginDTO,
  type ChangePasswordDTO,
  type ForgotPasswordDTO,
  type ResetPasswordDTO,
};

import { z } from "zod";

import { UserRolesEnum } from "@/shared/constants/user.constants.js";

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
  .max(64, { error: "Password cannot exceed 64 characters" })
  .regex(/[A-Z]/, { error: "Must include uppercase letter" })
  .regex(/[a-z]/, { error: "Must include lowercase letter" })
  .regex(/[0-9]/, { error: "Must include number" });

const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

// login schema
const loginSchema = z
  .object({
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
    password: passwordSchema,
  })
  .refine((data) => data.email || data.username, {
    error: "Email or username is required",
    path: ["email"],
  });

const verifyEmailParamsSchema = z.object({
  verificationToken: z.string().min(1, { error: "Verification token is required" }),
});

const resetPasswordParamsSchema = z.object({
  resetToken: z.string().min(1, { error: "Reset token is required" }),
});

const userIdParamsSchema = z.object({
  userId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, { error: "Invalid user id" }),
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
  email: emailSchema,
});

// reset password schema
const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

const assignRoleSchema = z.object({
  role: z.enum(UserRolesEnum),
});

type RegisterDTO = z.infer<typeof registerSchema>;
type LoginDTO = z.infer<typeof loginSchema>;
type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
type AssignRoleDTO = z.infer<typeof assignRoleSchema>;

export {
  registerSchema,
  loginSchema,
  verifyEmailParamsSchema,
  resetPasswordParamsSchema,
  userIdParamsSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  assignRoleSchema,

  // types export
  type RegisterDTO,
  type LoginDTO,
  type ChangePasswordDTO,
  type ForgotPasswordDTO,
  type ResetPasswordDTO,
  type AssignRoleDTO,
};

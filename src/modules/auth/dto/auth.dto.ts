import { z } from "zod";

import { AvailableLoginsEnum } from "@/shared/constants/user.constants.js";

const emailSchema = z.email("Invalid email format");

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 chars")
  .max(30, "Username cannot exceed 30 chars");

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 chars")
  .max(50, "Password too long");

// ------------------
// Register DTO
// -----------------
export const registerDTO = z
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

// ------------------
// Login DTO
// -----------------

export const loginDTO = z.object({
  email: emailSchema,
  password: passwordSchema,
});

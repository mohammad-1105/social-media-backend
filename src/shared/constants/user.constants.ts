import { env } from "@/config/env.js";

export const UserRolesEnum = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type UserRolesEnumType = (typeof UserRolesEnum)[keyof typeof UserRolesEnum];
export const AvailableRolesEnum = Object.values(UserRolesEnum) as UserRolesEnumType[];
export type AvailableRolesEnumType = typeof AvailableRolesEnum;

export const UserLoginEnum = {
  GOOGLE: "GOOGLE",
  GITHUB: "GITHUB",
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
} as const;

export type UserLoginEnumType = (typeof UserLoginEnum)[keyof typeof UserLoginEnum];
export const AvailableLoginsEnum = Object.values(UserLoginEnum) as UserLoginEnumType[];
export type AvailableLoginsEnumType = typeof AvailableLoginsEnum;

export const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000; // 20 minutes

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

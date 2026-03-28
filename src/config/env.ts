import { config } from "dotenv";
import { z } from "zod";

config({
  path: ".env",
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, "Missing DATABASE URL"),
  CORS_ORIGIN: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(1),
  ACCESS_TOKEN_EXPIRY: z.string().min(1),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  REFRESH_TOKEN_EXPIRY: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  FORGOT_PASSWORD_REDIRECT_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errorTree = z.treeifyError(parsed.error);

  console.error("❌ Invalid environment variables:\n");

  for (const message of errorTree.errors) {
    console.error(`  ${message}`);
  }

  for (const [field, fieldError] of Object.entries(errorTree.properties ?? {})) {
    if (fieldError.errors.length === 0) continue;
    console.error(`  ${field}: ${fieldError.errors.join(", ")}`);
  }

  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

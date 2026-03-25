import { config } from "dotenv";
import { z } from "zod";

config({
  path: ".env",
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, "Missing DATABASE URL"),
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

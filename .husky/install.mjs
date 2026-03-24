import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.NODE_ENV === "production" || process.env.CI === "true") {
  process.exit(0);
}

const huskyDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(huskyDir, "..");
const repoRoot = path.resolve(backendDir, "..");
const gitDir = path.join(repoRoot, ".git");

if (!existsSync(gitDir)) {
  process.exit(0);
}

process.chdir(repoRoot);

const husky = (await import("husky")).default;
const hooksPath = path.relative(repoRoot, huskyDir);
const result = husky(hooksPath);

if (result) {
  console.log(result);
}

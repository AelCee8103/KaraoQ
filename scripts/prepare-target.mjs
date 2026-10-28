import { existsSync, cpSync, rmSync, mkdirSync } from "fs";

const target = process.env.DEPLOY_TARGET || "vercel";

if (target === "puter") {
  console.log("Preparing build for Puter (static export target)...");
  // Ensure api folder does not block static export if present
  if (existsSync("src/app/api")) {
    if (!existsSync("src/server/adapters/next/api")) {
      cpSync("src/app/api", "src/server/adapters/next/api", { recursive: true });
    }
    rmSync("src/app/api", { recursive: true, force: true });
  }
} else {
  console.log("Preparing build for Vercel (Next.js server target)...");
  // Restore api route handlers
  if (existsSync("src/server/adapters/next/api") && !existsSync("src/app/api")) {
    cpSync("src/server/adapters/next/api", "src/app/api", { recursive: true });
  }
}

import * as esbuild from "esbuild";
import { existsSync, mkdirSync } from "fs";

if (!existsSync("workers/dist")) {
  mkdirSync("workers/dist", { recursive: true });
}

async function build() {
  console.log("Bundling Puter Worker API with esbuild...");

  await esbuild.build({
    entryPoints: ["workers/api/index.ts"],
    bundle: true,
    outfile: "workers/dist/worker.js",
    platform: "node",
    target: "es2022",
    format: "esm",
    minify: false,
    external: ["@heyputer/puter.js"],
    alias: {
      "@": "./src",
    },
  });

  console.log("✓ Puter Worker built successfully at workers/dist/worker.js");
}

build().catch((err) => {
  console.error("Worker build failed:", err);
  process.exit(1);
});

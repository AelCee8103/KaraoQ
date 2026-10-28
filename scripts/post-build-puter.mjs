import { existsSync, copyFileSync } from "fs";

console.log("Checking Puter site export artifacts...");

if (!existsSync("out/.puter_site_config")) {
  if (existsSync(".puter_site_config")) {
    copyFileSync(".puter_site_config", "out/.puter_site_config");
    console.log("✓ Copied .puter_site_config to out/.puter_site_config");
  } else {
    console.error("⚠ Warning: .puter_site_config is missing!");
  }
} else {
  console.log("✓ .puter_site_config verified in out/");
}

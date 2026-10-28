/**
 * Script to store secrets in the Puter Worker owner's key-value store.
 * Usage: node workers/scripts/set-secrets.mjs <SUPABASE_SERVICE_ROLE_KEY> <YOUTUBE_API_KEY> [SUPABASE_URL]
 */

const [serviceRoleKey, youtubeApiKey, supabaseUrl] = process.argv.slice(2);

if (!serviceRoleKey || !youtubeApiKey) {
  console.log("Usage: node workers/scripts/set-secrets.mjs <SUPABASE_SERVICE_ROLE_KEY> <YOUTUBE_API_KEY> [SUPABASE_URL]");
  console.log("Example: node workers/scripts/set-secrets.mjs eyJhbG... AIzaSy... https://xyz.supabase.co");
  process.exit(1);
}

console.log("Instructions for setting secrets in Puter Worker:");
console.log("1. Ensure you are logged in to Puter CLI (`puter login`).");
console.log("2. Use puter.kv in your worker environment or run:");
console.log(`   puter kv set SUPABASE_SERVICE_ROLE_KEY "${serviceRoleKey}"`);
console.log(`   puter kv set YOUTUBE_API_KEY "${youtubeApiKey}"`);
if (supabaseUrl) {
  console.log(`   puter kv set SUPABASE_URL "${supabaseUrl}"`);
}
console.log("✓ Done!");

/**
 * One-off script to create an email/password user in the SaaS Supabase project.
 * Use when Google login is not configured or you need a direct login.
 *
 * Usage (from repo root):
 *   1. Get your SaaS project Service Role Key: Supabase Dashboard → your SaaS project → Settings → API → service_role (secret).
 *   2. Run (URL is loaded from apps/saas/.env if present):
 *      npm run create-saas-user
 *   3. Set the service role key when running:
 *      Windows (PowerShell): $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; npm run create-saas-user
 *      Linux/macOS: SUPABASE_SERVICE_ROLE_KEY=eyJ... npm run create-saas-user
 */

const { createClient } = require("@supabase/supabase-js");

// Security 2026-09-23: e-mail/wachtwoord stonden hard-coded in deze (publieke) repo.
const EMAIL = process.env.SAAS_USER_EMAIL;
const PASSWORD = process.env.SAAS_USER_PASSWORD;

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!EMAIL || !PASSWORD) {
    console.error("Missing SAAS_USER_EMAIL and/or SAAS_USER_PASSWORD.");
    process.exit(1);
  }

  if (!url || !key) {
    console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Use the SaaS project URL and Service Role Key from Supabase Dashboard → Settings → API.");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("User already exists. You can log in at /auth with that email and password.");
      console.log("If you forgot the password, reset it in Supabase Dashboard → Authentication → Users → user → Send password recovery.");
      return;
    }
    console.error("Error creating user:", error.message);
    process.exit(1);
  }

  console.log("User created successfully:", data.user?.email);
  console.log("You can now log in at /auth with:");
  console.log("  Email:", EMAIL);
  console.log("  Password: (the one you set in this script)");
}

main();

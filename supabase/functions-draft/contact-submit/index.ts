// Entry voor Supabase Edge Runtime. Deploy ALLEEN expliciet (zie ../README.md):
//   supabase functions deploy contact-submit --project-ref pesfakewujjwkyybwaom --no-verify-jwt
import { handle } from "./handler.ts";

Deno.serve((req) =>
  handle(req, {
    env: {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      CONTACT_DB_KEY: Deno.env.get("CONTACT_DB_KEY"),
      TURNSTILE_SECRET_KEY: Deno.env.get("TURNSTILE_SECRET_KEY"),
      CONTACT_ALLOWED_ORIGINS: Deno.env.get("CONTACT_ALLOWED_ORIGINS"),
    },
    fetch,
    log: (outcome) => console.log(JSON.stringify({ fn: "contact-submit", outcome })),
  })
);

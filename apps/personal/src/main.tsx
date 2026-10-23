import { createRoot } from "react-dom/client";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

// Statische toegang per variabele (2026-10-23): `import.meta.env[key]` laat Vite het hele env-object
// in de entry-chunk zetten, dus élke VITE_*-variabele van het Vercel-project (ook ongebruikte) stond
// publiek in /assets/index-*.js. Bewaakt door scripts/bundle-guard.mjs (env-object-check).
const requiredEnv = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};

const missing = Object.entries(requiredEnv).filter(([, value]) => !value).map(([key]) => key);

if (missing.length > 0) {
  root.render(
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: 600 }}>
      <h1 style={{ color: "#b91c1c" }}>Configuration Error</h1>
      <p>The following required environment variables are missing:</p>
      <ul>
        {missing.map((key) => (
          <li key={key}>
            <code>{key}</code>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: "1rem", color: "#6b7280" }}>
        Make sure <code>.env</code>, <code>.env.development</code>, or <code>.env.production</code> contains these values, then restart the dev server.
      </p>
    </div>
  );
} else {
  const preloadedEl = document.getElementById("__PRELOADED__");
  const preloadedData = preloadedEl?.textContent
    ? (() => {
        try {
          return JSON.parse(preloadedEl.textContent!) as { blogPost?: unknown } | null;
        } catch {
          return null;
        }
      })()
    : null;

  import("./App").then(({ default: App }) => {
    root.render(<App preloadedData={preloadedData ?? undefined} />);
  });
}

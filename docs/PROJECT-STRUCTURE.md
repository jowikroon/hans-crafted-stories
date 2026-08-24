# Project structure

One repo, three deployable apps and shared packages. Deployments and dev commands are at the end.

---

## Repository hierarchy

```
hans-crafted-stories/
├── apps/
│   ├── personal/                   → hansvanleeuwen.com (agency + operator tools)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── pages/              # Index, Work, About, Writing, Portal, Empire, HansAI, Command, etc.
│   │   │   ├── components/         # Navbar, Footer, portal/, empire/, wiki/, ui (local)
│   │   │   ├── hooks/
│   │   │   ├── integrations/       # Supabase client (personal app project)
│   │   │   ├── lib/
│   │   │   ├── contexts/
│   │   │   ├── data/
│   │   │   └── assets/
│   │   ├── public/
│   │   ├── scripts/                # check-og-image, inject-static-content, build-ssr, prerender
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── vercel.json             # deploy config (Vercel leest deze, niet de repo-root)
│   │   └── package.json            # @hans/personal
│   │
│   ├── thought-canvas/             → hansvanleeuwen.com/blogs (blog / thought-canvas)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── pages/
│   │   │   ├── components/         # Header, ArticleCard, ui (local)
│   │   │   ├── hooks/
│   │   │   ├── data/
│   │   │   └── lib/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── vercel.json
│   │   └── package.json            # @hans/thought-canvas
│   │
│   └── saas/                       → marketplacegrowth.nl (product: marketing + app)
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── pages/              # Landing, public/*, app/*, workspace/*
│       │   ├── components/         # layouts (PublicLayout, AppShell, RequireAuth), app/, ui (local)
│       │   ├── hooks/
│       │   ├── integrations/       # Supabase client (SaaS project), lovable
│       │   ├── lib/
│       │   └── assets/
│       ├── public/
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── vercel.json
│       └── package.json            # @hans/saas
│
├── packages/
│   ├── ui/                         # Shared design system (shadcn/Radix)
│   │   ├── src/
│   │   │   ├── components/         # button, card, dialog, form, sidebar, toast, etc.
│   │   │   ├── hooks/             # use-mobile, use-toast
│   │   │   ├── lib/               # utils (cn)
│   │   │   └── index.ts           # barrel exports
│   │   ├── package.json           # @hans/ui
│   │   └── tsconfig.json
│   │
│   └── config/                    # Shared tooling
│       ├── eslint.config.js
│       ├── tsconfig.base.json
│       └── package.json           # @hans/config
│
├── supabase/                      # Personal app Supabase (hansvanleeuwen)
│   ├── config.toml
│   ├── migrations/
│   └── functions/
│
├── supabase-saas/                 # SaaS Supabase (marketplacegrowth)
│   ├── config.toml
│   ├── migrations/
│   └── functions/
│
├── scripts/                       # Repo-level scripts
│   └── create-saas-user.cjs       # One-off: create email/password user in SaaS project
│
├── docs/
├── .github/workflows/             # CI (build-personal, build-saas, build-thought-canvas, post-commit-check)
├── package.json                   # Workspace root, dev/build/lint scripts
├── tsconfig.json                  # References apps/* and packages/*
└── .gitignore
```

---

## What lives where

| Path | Purpose |
|------|--------|
| **apps/personal** | hansvanleeuwen.com — agency site, Portal, Empire, HansAI, Command, Wiki, auth callback. Own Supabase. |
| **apps/saas** | marketplacegrowth.nl — landing, marketing pages, auth, /app and /app/workspace/:id. Own Supabase. |
| **apps/thought-canvas** | hansvanleeuwen.com/blogs — blog / thought-canvas app (local UI). |
| **packages/ui** | Shared UI components and hooks used by personal and saas apps. |
| **packages/config** | Shared ESLint and TypeScript base config. |
| **supabase/** | Personal app Supabase project (migrations, Edge Functions). |
| **supabase-saas/** | SaaS Supabase project (migrations, Edge Functions). |

---

## Commands (from repo root)

| Command | Effect |
|---------|--------|
| `npm run dev:personal` | Run personal app → http://localhost:8080 (hansvanleeuwen.com) |
| `npm run dev:saas` | Run SaaS app → http://localhost:8081 (marketplacegrowth.nl) |
| `npm run dev:thought-canvas` | Run thought-canvas app → http://localhost:8082 (hansvanleeuwen.com/blogs) |
| `npm run build:personal` | Build personal app with SEO prerender pipeline (output: apps/personal/dist) |
| `npm run build:saas` | Build SaaS app (output: apps/saas/dist) |
| `npm run build:thought-canvas` | Build thought-canvas app (output: apps/thought-canvas/dist) |
| `npm run build` | Build all three apps |
| `npm run lint` | Lint all three apps |
| `npm run typecheck` | Type-check all three apps |
| `npm run test` | Test all three apps |
| `npm run create-saas-user` | Create email/password user in SaaS Supabase (set SUPABASE_SERVICE_ROLE_KEY) |

---

## Deployments

- **Personal:** Vercel-project `hansvanleeuwen`, root directory `apps/personal`, production branch `main`, build command `cd ../.. && npm run build:personal` (uit `apps/personal/vercel.json`), output `dist` -> domain hansvanleeuwen.com. Cloudflare doet de DNS en bouwt een Pages-kopie mee die geen bezoekersverkeer serveert; zie `docs/hosting-context.md`. Keep this as the full workspace build, not `cd apps/personal && npx vite build`, because the full build runs static content injection, SSR bundling, and blog prerendering for SEO.
- **Thought-canvas (blogs):** Separate project, build `npm run build:thought-canvas`, output `apps/thought-canvas/dist` → hansvanleeuwen.com/blogs (via rewrite or subdomain).
- **SaaS:** Separate project on the same host, build `npm run build:saas`, output `apps/saas/dist` → domain marketplacegrowth.nl.

Each app has its own `vercel.json` (or equivalent) in its directory.

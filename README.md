```markdown
# Hans Crafted Stories

**Personal Website of Hans van Leeuwen**  
**E-commerce Manager & Marketplace Specialist (Amazon • bol.com)**

[![Live Site](https://img.shields.io/badge/Live-hansvanleeuwen.com-0A66C2?style=for-the-badge&logo=googlechrome&logoColor=white)](https://hansvanleeuwen.com)
[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable.dev-7C3AED?style=for-the-badge)](https://lovable.dev/projects/0dbbd95e-f224-47f0-8bad-0599bfdf2a0d)
[![Tech: React + TypeScript](https://img.shields.io/badge/Tech-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://vitejs.dev)

---

## Project Info

**Live Website**: https://hansvanleeuwen.com  
**Lovable Project**: https://lovable.dev/projects/0dbbd95e-f224-47f0-8bad-0599bfdf2a0d  
**GitHub Repository**: https://github.com/jowikroon/hans-crafted-stories

This repository is the **source of truth** for my personal professional website and storytelling platform.

---

## ✨ About the Project

**“Hans Crafted Stories”** showcases:
- My expertise in Amazon and bol.com marketplace management
- Real-world e-commerce case studies and lessons learned
- Carefully written personal and professional stories
- Experiments with AI tools and automation (**HansAI** section)

The site is a modern, blazing-fast single-page React application. I primarily edit it with natural language prompts in Lovable.dev. Every change is automatically committed here and deployed via Cloudflare Pages.

---

## Key Features

- Fully responsive, modern design (mobile-first)
- Lightning-fast performance (Vite + Cloudflare Edge)
- Beautiful, accessible UI with **shadcn/ui** + Tailwind CSS
- Dedicated **Writing** section for crafted stories & case studies
- **HansAI** playground and AI experiments
- Full **Supabase** backend ready for dynamic content
- Serverless functions support (`/functions`)
- Smooth animations (Framer Motion)

---

## 🗄️ Supabase Integration (Fully Ready)

The project is **pre-configured** for Supabase (Postgres + Auth + Storage + Realtime).  
This allows dynamic “Crafted Stories” instead of static Markdown files — stories are stored in the database, editable via Supabase dashboard, searchable, with images, tags, metrics, etc.

### Current Status
- `supabase/` folder already scaffolded (`config.toml`, `migrations/`, `seed.sql`)
- `.env.example`, `.env.development`, `.env.production` prepared
- Supabase client ready in `src/lib/supabase.ts` (auto-created by Lovable)

### How to Connect (2 minutes)
**Via Lovable (easiest)**:
1. Open your Lovable project
2. Go to **Project Settings → Integrations → Supabase**
3. Click **Connect** (or create new project) — keys are added automatically

**Manual**:
1. Create a project at https://supabase.com
2. Add these variables in Lovable (Project Settings → Environment Variables) and locally in `.env` files:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # only for edge functions
   ```

### Recommended Database Schema (Stories)
```sql
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text,                    -- markdown or rich text
  excerpt text,
  category text,                   -- amazon, bol-com, ai, personal
  published boolean default false,
  published_at timestamptz,
  image_url text,
  read_time_minutes int,
  views int default 0,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.stories enable row level security;
create policy "Public stories are viewable" on public.stories
  for select using (published = true);
```

### Local Development with Supabase CLI
```bash
npm install -g supabase
supabase start                  # opens local Studio at http://localhost:54323
supabase db push                # apply migrations
supabase db reset --seed        # reset with seed data
```

### Example Usage in React
```tsx
import { supabase } from '@/lib/supabase';

const { data: stories } = await supabase
  .from('stories')
  .select('*')
  .eq('published', true)
  .order('published_at', { ascending: false });
```

---

## Tech Stack

| Layer              | Technology                              |
|--------------------|-----------------------------------------|
| Framework          | React 18 + TypeScript + Vite            |
| Styling            | Tailwind CSS + shadcn/ui + Radix UI     |
| Routing            | React Router DOM                        |
| Animations         | Framer Motion                           |
| Backend / CMS      | Supabase (Auth, Postgres, Storage)      |
| Serverless         | Cloudflare Pages Functions              |
| Deployment         | Cloudflare Pages + Lovable.dev          |
| Testing            | Vitest                                  |

---

## Edit flow
See [docs/lovable-cursor-synergy.md](docs/lovable-cursor-synergy.md) for clear roles between Lovable and Cursor.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**  
Simply visit the [Lovable Project](https://lovable.dev/projects/0dbbd95e-f224-47f0-8bad-0599bfdf2a0d) and start prompting.  
Examples:
- “Make the Writing section dynamic using Supabase stories”
- “Add a new crafted story about my first Amazon FBA launch”
- “Redesign the hero section with dark mode and my photo”

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**  
Clone this repo and work locally. Pushed changes will also be reflected in Lovable.  
Only requirement: Node.js & npm (use nvm).

```sh
# 1. Clone
git clone https://github.com/jowikroon/hans-crafted-stories.git

# 2. Navigate
cd hans-crafted-stories

# 3. Install dependencies
npm i

# 4. Start dev server (hot reload)
npm run dev
```

Open → http://localhost:5173

**Edit a file directly in GitHub**  
- Navigate to any file  
- Click the pencil icon (Edit)  
- Make changes and commit

**Use GitHub Codespaces**  
- On the repo main page → “Code” button → “Codespaces” tab → “New codespace”

---

## How can I deploy this project?

**Instant Deploy via Lovable (recommended)**:  
1. Open https://lovable.dev/projects/0dbbd95e-f224-47f0-8bad-0599bfdf2a0d  
2. Make any changes  
3. Click **Share → Publish**  
→ Live site at hansvanleeuwen.com updates in < 60 seconds

**Automatic GitHub → Cloudflare Deploy**:  
Every push to `main` triggers a full production build:  
- Build command: `npm run build`  
- Output directory: `dist`  
- Preview deploys automatically created for Pull Requests

**Custom Domain** (already active):  
hansvanleeuwen.com is connected in Lovable → Project Settings → Domains.

---

## Project Structure (Key Folders)

```
├── src/                  # React components & pages (Writing.tsx, HansAI.tsx, etc.)
├── public/               # Static assets (images, favicon)
├── supabase/             # Database schema, migrations, config.toml
├── functions/            # Cloudflare / Supabase edge functions
├── .env.example          # Copy to .env.development & .env.production
├── vite.config.ts        # Vite configuration
```

---

## Roadmap

- [x] Supabase scaffolding complete
- [ ] Dynamic Writing section powered by Supabase
- [ ] Admin dashboard for managing stories
- [ ] Rich case studies with images from Supabase Storage
- [ ] Newsletter signup + contact form
- [ ] Dark/light mode toggle + improved SEO

---

**Made with ❤️ in the Netherlands**  
Built using the power of AI (Lovable.dev) + Supabase + Cloudflare Pages.

Feel free to explore the code, fork it, or reach out if you have questions!
```

**How to use this export**  
1. Go to https://github.com/jowikroon/hans-crafted-stories  
2. Click on **README.md** → pencil icon (Edit file)  
3. Delete everything  
4. Paste the entire content above  
5. Scroll down → **Commit changes**

Your GitHub repo now has a professional, branded, and detailed README.md.  
Ready to go live! 🚀  

(If you want any last tweak — e.g. add a specific story example or change wording — just tell me.)

# Lovable + Netlify troubleshooting

Lovable does **not** deploy to Netlify. The flow is:

```
Lovable  <-->  GitHub (jowikroon/hans-crafted-stories)  <-->  Netlify
```

- **Lovable** and **GitHub** talk to each other (Lovable connects to GitHub and commits; you connected this when you clicked "Connect to GitHub" in Lovable).
- **Netlify** only talks to **GitHub**. You must connect the same repo to Netlify from your Netlify account. If you don’t see the project in Netlify, the repo was never added to **that** Netlify account (or you’re in the wrong account/team).

---

## Step 1: Confirm which GitHub repo Lovable uses

1. Open your project in Lovable: https://lovable.dev/projects/… (use the real project URL from README or Lovable dashboard).
2. Click **GitHub** (or the Git / repo icon).
3. Note the repo: it should be **jowikroon/hans-crafted-stories** (or your fork). If it shows a different repo or “Connect to GitHub”, the Git side isn’t set up correctly for this project.

**If the repo is wrong or not connected:** In Lovable, use the GitHub / Connect option and connect the correct GitHub account and repo (jowikroon/hans-crafted-stories).

---

## Step 2: Confirm which Netlify account you’re in

1. Go to https://app.netlify.com and log in.
2. Check the top-left: **personal account** vs **team name**.
3. Sites can live under “Personal” or under a **Team**. Switch between them (e.g. team dropdown) and look for **hans-crafted-stories** (or whatever name you gave the site) in each.

**If you use multiple emails:** Log out and log in with the email you used when you first connected Netlify to GitHub. The site is tied to that Netlify account.

---

## Step 3: Check if the repo is connected to Netlify

1. In Netlify: **Sites** (or **Team** → **Sites**).
2. For each site, open it and go to **Site configuration** → **Build & deploy** → **Continuous deployment** (or **Build**).
3. Check **Repository**: it should show **jowikroon/hans-crafted-stories** (or your fork). If you don’t see any site linked to that repo, the project was never added to this Netlify account.

---

## Step 4: If the project is not in Netlify — add it

1. Netlify → **Add new site** → **Import an existing project**.
2. Choose **GitHub**.
3. Authorize Netlify for GitHub if asked.
4. Pick the **correct GitHub account** (e.g. jowikroon) and use the search box to find **hans-crafted-stories**.
5. Select **jowikroon/hans-crafted-stories**.
6. Build settings (should match `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** 20 (or set in Netlify UI / `netlify.toml`).
7. Click **Deploy**. After the first deploy, this site will appear in your Netlify dashboard and will redeploy on every push to the connected branch (usually `main`).

---

## Step 5: If the repo is connected but builds fail

- In Netlify: **Deploys** tab for the site → open the latest deploy → check the **build log**.
- Confirm **Branch** in **Build & deploy** is the one you push (e.g. `main`).
- Confirm **Build command** = `npm run build` and **Publish directory** = `dist` (or leave empty to use repo’s `netlify.toml`).

---

## Summary

| Step | What to check |
|------|----------------|
| 1 | Lovable shows repo **jowikroon/hans-crafted-stories** (or your fork). |
| 2 | You’re in the right Netlify account/team. |
| 3 | A site in that account has **Repository** = that GitHub repo. |
| 4 | If not: **Add new site** → **Import from GitHub** → pick that repo and deploy. |
| 5 | If builds fail: check build log, branch, and build/publish settings. |

Lovable and Netlify are linked only through GitHub: Lovable (and you) push to GitHub; Netlify pulls from GitHub. There is no separate “Lovable → Netlify” connection to fix in Netlify.

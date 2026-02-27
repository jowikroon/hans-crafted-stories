# Lovable + Cloudflare Pages — How it works

Lovable does **not** deploy directly. The flow is:

```
Lovable  <-->  GitHub (jowikroon/hans-crafted-stories)  <-->  Cloudflare Pages
Cursor   <-->  GitHub (jowikroon/hans-crafted-stories)  <-->  Cloudflare Pages
```

- **Lovable** and **Cursor** both push to the same **GitHub** repo.
- **Cloudflare Pages** auto-deploys from GitHub on every push to `main`.
- The live site at **hansvanleeuwen.com** is served by Cloudflare Pages.

---

## Step 1: Confirm which GitHub repo Lovable uses

1. Open your project in Lovable: https://lovable.dev/projects/… (use the real project URL).
2. Click **GitHub** (or the Git / repo icon).
3. Note the repo: it should be **jowikroon/hans-crafted-stories**.

**If the repo is wrong or not connected:** In Lovable, use the GitHub / Connect option and connect the correct GitHub account and repo.

---

## Step 2: Confirm Cloudflare Pages is connected

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**.
2. Find your Pages project for hansvanleeuwen.com.
3. Open it → **Settings** → **Builds & deployments**.
4. Confirm **Repository** shows **jowikroon/hans-crafted-stories** and **Production branch** is `main`.

---

## Step 3: If the project is not in Cloudflare Pages — add it

1. Cloudflare → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Choose **GitHub** and authorize if asked.
3. Pick **jowikroon/hans-crafted-stories**.
4. Build settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Node version:** 20
5. Click **Save and Deploy**.

---

## Step 4: If builds fail

- In Cloudflare Pages: open your project → **Deployments** → click the latest deployment → check the **build log**.
- Confirm **Production branch** is `main`.
- Confirm **Build command** = `npm run build` and **Output directory** = `dist`.

---

## Summary

| Step | What to check |
|------|----------------|
| 1 | Lovable shows repo **jowikroon/hans-crafted-stories**. |
| 2 | Cloudflare Pages project is connected to that same repo. |
| 3 | If not: create a new Pages project from that GitHub repo. |
| 4 | If builds fail: check build log, branch, and build settings. |

Lovable, Cursor, and Cloudflare Pages are linked only through GitHub. Both editors push to GitHub; Cloudflare Pages pulls from GitHub and deploys.

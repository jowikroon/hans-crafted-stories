# Cloudflare connection troubleshooting

Use this when you can’t connect to your Cloudflare account (dashboard login, wrong account, domain not showing) or when API/CLI connections fail (token, wrangler, scripts).

---

## 1. Dashboard login / “Wrong account”

### Symptom
You log in at [dash.cloudflare.com](https://dash.cloudflare.com) but don’t see **hansvanleeuwen.com** or your Workers.

### Checks

1. **Correct email**
   - Cloudflare ties accounts to the email you signed up with.
   - Try logging out and logging in with every email you might have used (personal, work, old addresses).

2. **Account vs team**
   - Top-left of the dashboard shows either your **personal account** or a **team name**.
   - Domains and Workers can be under **personal** or under a **team**. Use the account/team switcher and look for **hansvanleeuwen.com** in each.

3. **Invited as member**
   - If someone else added the zone, you need an **invitation** to that account/team.
   - Check the email that invited you → accept invite → then switch to that account/team in the dashboard.

4. **2FA / recovery**
   - If you can’t get past 2FA: use **recovery codes** or **account recovery** from the login page.
   - If you no longer have access to the email: [Cloudflare support](https://support.cloudflare.com) is the only way to recover the account.

---

## 2. Domain (hansvanleeuwen.com) not in the list

### Symptom
You’re logged in but **Websites** doesn’t show **hansvanleeuwen.com**.

### Checks

1. **Search**
   - In **Websites**, use the search box and type `hansvanleeuwen` or `hansvanleeuwen.com`.

2. **Filter by account**
   - Switch between **personal** and any **teams** (top-left). The domain might be in another account.

3. **Add the site**
   - If the domain was never added: **Websites** → **Add a site** → enter `hansvanleeuwen.com`.
   - You’ll need to point the domain’s **nameservers** (at the registrar) to the nameservers Cloudflare shows. If the domain is already on another provider, you may need to move it or update nameservers at the current registrar.

4. **Registrar vs DNS**
   - **Registered at Cloudflare** = you bought the domain through Cloudflare. It appears under **Websites** and you manage nameservers in the Overview/Registration section.
   - **Registered elsewhere** = you only use Cloudflare for DNS. You add the site in Cloudflare, then at your registrar you change nameservers to the ones Cloudflare gives you.

---

## 3. API token / “Connection” for CLI or scripts

### Symptom
Wrangler, a script, or an integration fails with **401**, **403**, or “invalid token” when talking to Cloudflare.

### Step 1 — Get or create a token

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens).
2. **Create Token** (or use an existing one).
3. For full control: use **Edit zone DNS** or **Edit zone** + **Workers** (or a custom token with the permissions you need).
4. Under **Account Resources** and **Zone Resources**, include the account and zone(s) you use (e.g. **hansvanleeuwen.com**).
5. Create and **copy the token once** (it won’t be shown again).

### Step 2 — Use the token

- **Wrangler (CLI):** run `npx wrangler login` (browser login) or set:
  - **Windows (PowerShell):** `$env:CLOUDFLARE_API_TOKEN = "your-token"`
  - **Linux/macOS:** `export CLOUDFLARE_API_TOKEN=your-token`
- **Scripts / CI:** set `CLOUDFLARE_API_TOKEN` in the environment (e.g. `.env` for local, secrets in GitHub Actions for CI).

### Step 3 — Verify the token

Run (replace `YOUR_TOKEN` with your token):

```bash
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" -H "Authorization: Bearer YOUR_TOKEN"
```

- **Success:** JSON includes `"status": "active"`.
- **401 / invalid:** token is wrong or revoked; create a new one and try again.
- **403:** token exists but doesn’t have permission for the action; edit the token and add the right Zone/Account permissions.

### Step 4 — Permissions

- **DNS only:** need **Zone → DNS → Edit**.
- **Workers:** need **Account → Workers Scripts → Edit** (and Zone if you use a custom domain).
- **Zone (general):** need **Zone → Zone → Edit** for that zone.

If the token was created under a **team**, ensure the script/CLI is using the same account context (team members need a token with access to that team’s resources).

---

## 4. Quick checklist

| Issue | What to do |
|-------|------------|
| Can’t see hansvanleeuwen.com | Check account/team switcher; search Websites; add site if missing. |
| Logged in but “wrong” account | Switch account/team; try other emails; accept any pending invites. |
| 401 / invalid token | Create new token at Profile → API Tokens; set `CLOUDFLARE_API_TOKEN`; verify with curl above. |
| 403 / forbidden | Edit token; add Zone/Account permissions for DNS, Workers, or Zone as needed. |
| Wrangler not logged in | Run `npx wrangler login` or set `CLOUDFLARE_API_TOKEN`. |

---

## 5. Useful links

- **Dashboard:** [dash.cloudflare.com](https://dash.cloudflare.com)
- **API tokens:** [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
- **Token verify API:** [Cloudflare API – Verify token](https://developers.cloudflare.com/fundamentals/api/troubleshooting/)
- **Support:** [support.cloudflare.com](https://support.cloudflare.com)

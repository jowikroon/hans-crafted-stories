# hansvanleeuwen.com — Point domain to Netlify

**DNS is in Cloudflare.** Choose one:

- **Option A (below):** Use Netlify DNS — change nameservers to the four NS1 servers (Netlify will manage DNS).
- **Option B (further down):** Keep Cloudflare DNS — add an A record and CNAME in Cloudflare pointing to Netlify (no nameserver change).

---

## Option A: Use Netlify DNS (change nameservers)

Change nameservers at **the registrar where you bought the domain** (if the domain is registered at Cloudflare, see the “Changing nameservers in Cloudflare” section at the bottom).

### Steps

1. **Log in** to your domain registrar (where you bought and registered hansvanleeuwen.com).
2. Open **DNS** or **Domain settings** or **Nameservers** for hansvanleeuwen.com.
3. **Replace** the current nameservers with these four:

   ```
   dns1.p06.nsone.net
   dns2.p06.nsone.net
   dns3.p06.nsone.net
   dns4.p06.nsone.net
   ```

4. **Save** and wait for propagation (can take a few minutes up to 24–48 hours).

## Notes

- These are **NS1** nameservers (often used by Netlify when you use “Netlify DNS” for the domain).
- After propagation, DNS for hansvanleeuwen.com will be managed where you added this domain (e.g. in Netlify → Domain management). You can add/edit A, CNAME, MX, TXT, etc. there.
- If you currently use **Cloudflare** for DNS (and want to keep using Cloudflare instead of switching nameservers), you typically **do not** change to these nameservers; instead you add an A record or CNAME at Cloudflare pointing to Netlify. Only change nameservers if you want DNS to be managed by the provider that gave you these four (e.g. Netlify/NS1).

---

## Option B: Keep DNS in Cloudflare (recommended if you use Zero Trust, Workers, etc.)

If you want **hansvanleeuwen.com** to serve your Netlify site but keep managing DNS in Cloudflare, do **not** change nameservers. Add these records in Cloudflare instead.

### In Cloudflare dashboard

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and log in.
2. Click **Websites** → select **hansvanleeuwen.com**.
3. Go to **DNS** → **Records**.
4. Add or update:

| Type  | Name | Content / Target              | Proxy status | TTL  |
|-------|------|-------------------------------|--------------|------|
| **A** | `@`  | `75.2.60.5`                  | DNS only     | Auto |
| **CNAME** | `www` | `<your-site>.netlify.app` | DNS only     | Auto |

- **A record `@`**: apex domain (hansvanleeuwen.com). Value **75.2.60.5** is Netlify’s load balancer.
- **CNAME `www`**: replace `<your-site>` with your Netlify site name (e.g. from Netlify → Site → Domain management; it’s the `xxx.netlify.app` hostname).

5. **Proxy status**: use **DNS only** (grey cloud) for the A and CNAME that point to Netlify, so SSL and routing work correctly.
6. Remove or change any existing **A** or **CNAME** for `@` and `www` that point elsewhere, so only these Netlify records apply.

### Where to get the Netlify hostname

- Netlify → your site → **Domain management** → under “Netlify subdomain” you’ll see something like **random-name-12345.netlify.app**. Use that for the **www** CNAME target (with **www** as the name in Cloudflare).

---

## Changing nameservers in Cloudflare (Option A – use Netlify DNS)

If you **do** want to use the NS1 nameservers (Netlify DNS), change them at the **registrar** where the domain was bought. If the domain is **registered** at Cloudflare:

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Websites** → **hansvanleeuwen.com**.
2. Go to **Overview** (or **Registration** if you see it).
3. Find **Nameservers** / **Registrar configuration**.
4. Replace the current nameservers with:
   - `dns1.p06.nsone.net`
   - `dns2.p06.nsone.net`
   - `dns3.p06.nsone.net`
   - `dns4.p06.nsone.net`
5. Save. After propagation, DNS is managed in Netlify (Domain management), not in Cloudflare.

If the domain was **registered elsewhere** (e.g. TransIP, Namecheap) but only **DNS** is in Cloudflare, change the nameservers at that **registrar**, not in Cloudflare.

---

## More info

- [Netlify: DNS records](https://docs.netlify.com/manage/domains/configure-domains/dns-records)
- [Netlify: Set up Netlify DNS](https://docs.netlify.com/manage/domains/set-up-netlify-dns)
- [Cloudflare: DNS records](https://developers.cloudflare.com/dns/manage-dns-records/)

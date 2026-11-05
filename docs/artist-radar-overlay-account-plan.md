# Artist Radar — on-page experience, accounts and tickets

Status: development proposal/implementation work in progress, **not approved for production**  
Date: 2026-11-05  
Source baseline: `jowikroon/hans-crafted-stories@29b31fbf19bf1f12ae93314fd6b3594cc3cca41c`  
Context: music/HVL only; HansOS GitHub vault `30eab51a1d58bb5fb6f36c3dbef14aa8bce88c0f`, source-snapshot freshness **UNKNOWN**.

**Staging-update, dezelfde dag:** een onafhankelijke Supabase-testdatabase en een openbare read-only Edge Function zijn aangemaakt. Database-RLS, cross-account writes en de 100-volgersgrens zijn met rollback geverifieerd. Auth-mail, echte sessions, browser-/mobiele UX en verkoperslinks zijn nog open; de feature flag blijft UIT. Zie [de actuele staging-acceptatie](artist-radar-staging-acceptance-2026-11-05.md). De tabel met oorspronkelijke baseline hieronder blijft de historische uitgangspositie, niet de laatste QA-stand.

## Product promise

Keep the visitor on `/music`: the existing animated neon Artist Radar becomes the visual doorway into a focused overlay. Explore publicly visible artist/concert signals first; require a verified account only to **save** follows and preferences. Never turn an email-digest subscription into a logged-in account merely because both use the same email address.

### Surface and journey

1. The radar CTA, animated visual's explicit accessible trigger and footer can open the same dialog without leaving `/music`. Preserve the original `/muziek/artist-radar` route for compatibility with existing links.
2. Use Radix Dialog: title, description, focus trap, `Escape`, close button, focus restoration and backdrop behavior. Keep `/music` canonical metadata unchanged; use a query parameter to support Back/Forward and deep links without a separate page.
3. Desktop: quiet near-black overlay, animated radar and concise discovery beside the account area. Mobile: responsive sheet that scrolls internally, keeps close and navigation visible, supports narrow viewports and on-screen keyboards. Use Switzer and JetBrains Mono, the site's existing font variables, and the current acid-lime accent rather than the old standalone copper theme.
4. Animation must pause while hidden/inactive, clean up `requestAnimationFrame`, stop in hidden tabs and respect `prefers-reduced-motion`. A non-animated event list must provide equivalent information.
5. A visitor may browse available source signals without providing an email. Saving a radar requests passwordless email verification via Supabase Auth. Once authenticated, show follows, rubrieken, latest status, relevant events, and account activity. **All account features default to disabled** until isolated staging proof, through `VITE_ARTIST_RADAR_ACCOUNTS_ENABLED=true` set only for a reviewed build bound to a non-production backend. Vercel feature previews can inherit the production Supabase URL, so SSO alone is not sufficient.
6. User-selected rubrieken are notification **interests** (rumours, announcements and ticket sales); an event's `status` is a distinct verified feed **fact**. Do not mix them.
7. The legacy Artist Radar weekly email requires explicit consent and its own double opt-in. It is not automatically enabled by creating an account.

### Personal-data and truth boundaries

- A Supabase Auth identity, not a name/email form field, owns persisted follows and history. Apply explicit `auth.uid()` row-level access policies for every operation; never accept a caller-supplied user identity as authority.
- Record minimal, user-visible account activity such as following or unfollowing an artist and opening a ticket provider link. An external click is **not** a ticket purchase.
- Show last source update/verification times where available. If a feed or the account store is unavailable, show a recoverable error rather than stale data as live. Do not manufacture previous event states: status-change history needs separately evidenced source events.
- Provide transparent sign-out, account-data handling and a privacy notice before public launch. Do not expose subscriber tokens, emails or service-role credentials through public feed endpoints.
- Before opening public registrations, verify Supabase Auth's *actual* SMTP or Send Email Hook delivery, email/IP rate limits, abuse protection (for example CAPTCHA), and redirect allowlist. The existing Resend setup for the newsletter is not proof that Auth email delivery is configured.
- Before public launch, define an export/deletion path that covers Supabase user data, notification history and any separate mailing-list records; database cascades alone do not delete third-party email-service records.
- `/privacy` now contains an explicit Artist Radar account, digest and outbound ticket section (NL/EN), linked from the account sign-up, but legal sign-off and a concrete activity-retention schedule remain required. Do not assert that clicking a seller link means an order was placed.

## Ticket product boundary

The current `artist-radar-public-events` response has no verified purchase URL, order reference, seller, inventory or price. Native payments, owned ticket inventory and purchases are **not** part of the current authorized integration. An in-account **Tickets kopen** action may open an independently verified official HTTPS sales destination, labelled with the seller; unverified, rumoured or sold-out events cannot display a buy action. Any purchase history and `Gekocht` state require genuine provider order confirmation/webhook and a commercial integration.

Before an actual on-site checkout: identify the authorized partner, contractual/API permissions, checkout/payment ownership, cancellation/refund support, privacy/DPA and test transactions. Never simulate successful purchases in production UI.

At the 2026-11-05 read-only checkpoint the existing concert table has 71 records (63 active), of which 31 are future, active, non-seed listings (4 `available`, 27 `sold_out`). This status field is **not** proof of live ticket inventory. None of those records has a ticket sale URL independently verified under the new contract. No source-verified importer writes the new `artist_radar_status_history` rows or the new ticket evidence fields. To complete this product, a separate approved importer and evidence pipeline is needed; prove at least two actual status transitions and one verified seller destination in staging before allowing buying affordances.

**Upstream event-identity limitation:** The live unique index and importer v8 both use `(artist_id, venue, sort_key)`; multiple same-artist, same-venue, same-day shows collapse or reject. The weekly digest v9 also deduplicates by artist/country/city/day, potentially collapsing different venues. Fix database identity, importer and digest together using authoritative event IDs and start times before claiming complete concert coverage. Avoid removing the unique constraint alone; the importer depends on it.

## Acceptance gates

| Gate | Required proof | Current baseline |
| --- | --- | --- |
| Visual & route | Same animated radar; open/close on `/music`, Back/Forward, canonical preserved, focus returned | Dialog unit tests and static review; cross-browser route E2E pending |
| Responsive & a11y | 320/375/768/1440 widths, short-height, 200% zoom, keyboard, mobile keyboard, reduced motion | CSS and JSDOM checks; actual browser/screen-reader QA pending |
| Public feed | Only evidenced future signals, explicit stale/offline messages, no merging distinct same-day shows | New offline Edge tests; actual feed still has upstream identity limitation |
| Account creation | Real received email, verified session creation, return to radar on same/different device, renewal/sign-out | **Flag OFF**; separate staging project absent; SMTP and redirect allowlist unverified |
| Account privacy | Two-user isolation of follows/history under RLS; anonymous cannot read/write | SQL and unit review only, database-backed tests pending; legal/privacy retention and export/deletion pending |
| Newsletter | Explicit opt-in; existing confirm/unsubscribe and cooldown preserved | 24 offline mocks passing at baseline |
| Ticket safety | Official verified URL only; sold-out/no URL disabled; external click not `Gekocht` | All current ticket links unavailable, no status-writer or provider order integration |
| Regression | Existing music/player, SEO, CSS, and page routes still work; full TS/Vitest/build green | Offline tests and production build PASS before final feature-flag changes; final rerun required |
| Release | Isolated Supabase staging, real mail and provider dry-run, security review, concrete production approval | **No staging configuration; no production go** |

## Release sequence

1. Review the branch and test the UI with fake/mock events in an isolated local browser. Keep the account build flag OFF in ordinary previews, because Vercel preview builds can inherit `.env.production` and contact the live Supabase database. The public GET function must deploy explicitly with `verify_jwt=false` and no private data.
2. Provision an independently isolated Supabase staging project with allowed redirect URLs, verified SMTP/Send Email Hook and explicit abuse limits; run migration and two distinct test users, test actual email delivery and database RLS. Do not use customer accounts or production service-role credentials in a preview.
3. Run keyboard, mobile, reduced-motion, load/failure and SEO regressions on a non-public preview. Test Vercel SSO-protected email callback access with authorized testers; do not disable SSO without approval.
4. Make the existing event importer/digest compatible with stable event IDs, ticket-source evidence, and status snapshots. Backfill only with verified source records. Exercise a two-artist, two-user RLS scenario and real, source-proved status transitions in staging.
5. Only after approval for the exact release, separately migrate and deploy the production UI/backend. Use database backup, additive SQL, Edge-function smoke test, then frontend; monitor errors and preserve the existing standalone route as a fallback. Roll back frontend/Edge separately rather than blindly reversing additive database changes.

Historical Artist Radar design context was read from the vault, but its underlying Windows snapshot has no independently verifiable backup receipt. This document describes new implementation intent and must not be confused with a live release or verified payment integration.

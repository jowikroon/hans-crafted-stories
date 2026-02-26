

# GTM + GA4 + Consent Mode v2 Implementation Blueprint

This plan covers two parts: **(A)** code changes in this codebase, and **(B)** the GTM container configuration you need to do in tagmanager.google.com. I can only implement part A; part B is a detailed step-by-step guide you follow in the GTM web UI.

---

## Part A -- Code Changes (what I will implement)

### 1. Replace gtag.js with GTM container in `index.html`

Remove the comment placeholder and add the standard GTM snippet. You will need a GTM container ID (format `GTM-XXXXXXX`). I will use a placeholder `GTM-XXXXXXX` that you replace with your real ID.

**In `<head>` (as high as possible, after `<meta charset>`):**

```html
<!-- Google Tag Manager -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');
</script>
<!-- End Google Tag Manager -->
```

**In `<body>` (immediately after opening tag):**

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

### 2. Refactor `CookieConsent.tsx`

Remove all direct gtag.js / GA loading logic. Replace with dataLayer pushes that GTM listens to:

- On mount: push default consent state (denied) via dataLayer
- On accept: push `consent_update` event with granted values
- On decline: push `consent_update` event with denied values
- Persist choice in localStorage (keep existing pattern)
- On returning visitor with stored "accepted": push granted consent immediately

The component will push these dataLayer events:

```typescript
// Default (fires before GTM processes):
window.dataLayer.push({
  event: 'consent_default',
  consent: {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500,
    region: ['BE','BG','CZ','DK','DE','EE','IE','EL','ES','FR',
             'HR','IT','CY','LV','LT','LU','HU','MT','NL','AT',
             'PL','PT','RO','SI','SK','FI','SE','IS','LI','NO']
  }
});

// On accept:
window.dataLayer.push({
  event: 'consent_update',
  consent: {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
  }
});

// On decline:
window.dataLayer.push({
  event: 'consent_update',
  consent: {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  }
});
```

### 3. Add dataLayer initialization in `index.html`

Before the GTM script, ensure `window.dataLayer = window.dataLayer || [];` is set so consent defaults are queued before GTM loads.

### 4. Update TypeScript declarations

Update the global `Window` interface to type `dataLayer` properly.

---

## Part B -- GTM Container Configuration (manual steps in GTM UI)

### GTM Architecture Diagram

```text
+--------------------------------------------------+
|  index.html                                       |
|  1. dataLayer init                                |
|  2. CMP pushes consent_default to dataLayer       |
|  3. GTM container loads (gtm.js)                  |
+--------------------------------------------------+
         |
         v
+--------------------------------------------------+
|  GTM Container                                    |
|                                                   |
|  TAGS:                                            |
|  [1] Consent Default (Consent Initialization)     |
|      - setDefaultConsentState                     |
|      - Trigger: Consent Initialization - All Pages|
|                                                   |
|  [2] Consent Update                               |
|      - updateConsentState                         |
|      - Trigger: Custom Event = consent_update     |
|                                                   |
|  [3] GA4 Configuration                            |
|      - Measurement ID: G-2YX26R0RZK              |
|      - Built-in consent checks: ON               |
|      - Trigger: All Pages                         |
|      - Requires consent: analytics_storage        |
|                                                   |
|  [4] GA4 Event tags (future)                      |
|      - purchase, add_to_cart, begin_checkout      |
|      - Trigger: Custom Events from dataLayer      |
|                                                   |
|  TRIGGERS:                                        |
|  [A] Consent Initialization - All Pages           |
|  [B] All Pages (pageview)                         |
|  [C] CE - consent_update                          |
|  [D] CE - purchase (future)                       |
|  [E] CE - add_to_cart (future)                    |
|                                                   |
|  VARIABLES:                                       |
|  [i]   DLV - consent (Data Layer Variable)        |
|  [ii]  URL Path                                   |
|  [iii] Page Hostname                              |
+--------------------------------------------------+
         |
         v
+--------------------------------------------------+
|  GA4 Property (G-2YX26R0RZK)                     |
|  - Receives hits only when analytics_storage      |
|    is granted                                     |
|  - URL passthrough for cookieless pings           |
|  - Ads data redaction when ad_storage denied      |
+--------------------------------------------------+
```

### Step-by-step GTM setup

#### 1. Create GTM Container
- Go to tagmanager.google.com
- Create a Web container for hansvanleeuwen.com
- Note the GTM-XXXXXXX ID

#### 2. Consent Default Tag
- Tag type: **Google Tag - Consent Initialization**
- Use the community template "Consent Mode (Google tags)" or the built-in consent overview
- Set **setDefaultConsentState** with all storage types denied for EEA regions (use region codes list above)
- Set `wait_for_update: 500`
- Set `security_storage: granted` (always)
- Trigger: **Consent Initialization - All Pages**

#### 3. Consent Update Tag
- Tag type: **Google Tag - Consent Update** (or custom HTML using the consent template)
- Read values from Data Layer Variable `consent`
- Trigger: Custom Event where Event Name equals `consent_update`
- Uses **updateConsentState** to set values from the dataLayer push

#### 4. GA4 Configuration Tag
- Tag type: **Google Analytics: GA4 Configuration**
- Measurement ID: `G-2YX26R0RZK`
- Enable built-in consent checks
- Required consent: `analytics_storage`
- Under Additional Settings:
  - URL Passthrough: enabled
  - Ads Data Redaction: enabled
- Trigger: **All Pages**
- Ensure only ONE GA4 config tag exists (no duplicates)

#### 5. Variables to create
| Variable | Type | Path/Value |
|---|---|---|
| DLV - consent | Data Layer Variable | `consent` |
| DLV - consent.analytics_storage | Data Layer Variable | `consent.analytics_storage` |
| DLV - consent.ad_storage | Data Layer Variable | `consent.ad_storage` |

#### 6. Future ecommerce event tags
When ready for conversion tracking, create GA4 Event tags for:
- `purchase` -- triggered by Custom Event `purchase`, reads `ecommerce` from dataLayer
- `add_to_cart` -- triggered by Custom Event `add_to_cart`
- `begin_checkout` -- triggered by Custom Event `begin_checkout`

All require `analytics_storage` consent.

---

## Common Failure Points Checklist

1. **Duplicate GA4 config** -- Remove ALL direct gtag.js from code. Only GTM should load GA4.
2. **Consent defaults fire too late** -- The Consent Initialization trigger must fire BEFORE All Pages. Using the built-in "Consent Initialization - All Pages" trigger guarantees this.
3. **dataLayer not initialized** -- Must be `window.dataLayer = []` before GTM snippet.
4. **localStorage not checked on reload** -- Returning visitors who accepted must push `consent_update` immediately on mount, before GTM processes pageview.
5. **Region codes wrong** -- Use ISO 3166-1 alpha-2 (NL, DE, FR, etc.), not 3166-2.
6. **wait_for_update too short** -- 500ms is the recommended minimum. Below 200ms, consent may not register before tags fire.
7. **GTM Preview not working** -- Ensure no Content-Security-Policy blocks `*.googletagmanager.com`.

---

## Production Deployment Plan

1. Implement code changes (Part A) -- merge to main
2. Create GTM container and configure tags/triggers (Part B)
3. Use GTM Preview mode to validate:
   - Consent Initialization fires first
   - GA4 config fires on All Pages (with consent check)
   - No duplicate pageviews in GA4 DebugView
   - Accepting cookies triggers `consent_update` and GA4 starts collecting
   - Declining cookies keeps GA4 in cookieless/blocked mode
4. Publish GTM container version 1
5. Verify in GA4 Realtime report that hits arrive from production

## Rollback Strategy

- GTM has built-in versioning. If issues arise, go to GTM > Versions > select previous version > Publish
- On the code side, reverting to the previous commit restores the old direct gtag.js implementation as a fallback

---

## Technical Summary of Code Changes

| File | Change |
|---|---|
| `index.html` | Add GTM snippet in head + noscript in body, add dataLayer init |
| `src/components/CookieConsent.tsx` | Remove direct gtag.js loading, replace with dataLayer consent pushes |

Two files changed. No new dependencies needed.


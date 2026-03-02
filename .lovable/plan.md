

# Install Hotjar Tracking Code

Add the Hotjar snippet (hjid: 6659262) directly into the `<head>` of `index.html`, right after the existing Google Tag Manager script. This ensures it loads on every page immediately.

## Change

**File: `index.html`**
- Insert the Hotjar tracking script after the GTM closing comment (line ~11), before the viewport meta tag
- The snippet will be exactly as provided by Hotjar

## Why index.html (not the tracking_scripts DB)

Your project has a tracking scripts manager in the portal, but for guaranteed first-page-load coverage and simplicity, placing it directly in `index.html` is the most reliable approach -- exactly as Hotjar recommends. You can optionally also add it to the tracking_scripts table later for dashboard visibility.

## Technical Detail

```text
index.html <head> order:
  1. dataLayer init
  2. Google Tag Manager
  3. Hotjar  <-- NEW
  4. viewport meta
  5. ... rest of head
```

No other files need changes. The script is async and non-blocking.


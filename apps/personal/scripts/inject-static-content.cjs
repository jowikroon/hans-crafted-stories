/**
 * Post-build script: inject static semantic HTML into <div id="root"> in dist/index.html.
 *
 * Why: The app uses createRoot().render() (full replacement), so React will replace this
 * content on load. Crawlers that don't execute JS will see real H1/H2/content/links in the
 * primary HTML instead of an empty root div, improving crawlability and first-paint content.
 *
 * Usage: node scripts/inject-static-content.cjs  (run after `vite build`)
 */

const fs = require("fs");
const path = require("path");

const DIST_HTML = path.resolve(__dirname, "../dist/index.html");

const STATIC_CONTENT = `<header>
    <nav aria-label="Primary navigation">
      <a href="/">Home</a> |
      <a href="/work">Marketplace cases</a> |
      <a href="/writing">Articles on Amazon and bol</a> |
      <a href="/about">About Hans van Leeuwen</a>
    </nav>
  </header>
  <main>
    <section aria-label="Introduction">
      <p>Freelance and interim marketplace manager</p>
      <h2>Hans van Leeuwen, marketplace manager for Amazon and bol</h2>
      <p>I help brands and retailers manage their strategy and day-to-day operations on Amazon and bol. My work covers product content, advertising, assortment and operational coordination. More recently, I have also worked with eBay.</p>
      <a href="/about#contact">Discuss your marketplace needs</a>
      <a href="/work">View marketplace cases</a>
      <p>Based in Amersfoort, Netherlands &middot; Working with brands across the Netherlands and the EU</p>
    </section>
    <section aria-label="Marketplace services">
      <h2>Marketplace management for Amazon and bol (NL/EU)</h2>
      <ul>
        <li><a href="/amazon-nl-specialist">Amazon NL specialist</a>: listings and A+ content, Amazon Ads, pricing and day-to-day account management for Amazon NL and DE.</li>
        <li><a href="/bol-com-consultant">bol.com consultant</a>: product content, advertising on bol, assortment and catalogue management, and reporting for sellers and vendors.</li>
        <li><a href="/interim-ecommerce-manager">Interim marketplace manager</a>: temporary cover for marketplace and e-commerce teams.</li>
        <li><a href="/ai-ecommerce-automation">AI e-commerce automation</a>: automating marketplace operations with a human on sensitive decisions.</li>
      </ul>
    </section>
  </main>
  <footer>
    <p>&copy; {{CURRENT_YEAR}} Hans van Leeuwen | Marketplace manager | Amersfoort, Netherlands</p>
    <nav aria-label="Footer navigation">
      <a href="/">Home</a> |
      <a href="/work">Cases</a> |
      <a href="/writing">Articles</a> |
      <a href="/about">About</a> |
      <a href="/privacy">Privacy</a>
    </nav>
  </footer>`;

if (!fs.existsSync(DIST_HTML)) {
  console.error(`[inject-static-content] dist/index.html not found. Run 'vite build' first.`);
  process.exit(1);
}

let html = fs.readFileSync(DIST_HTML, "utf8");

if (!html.includes('<div id="root">')) {
  console.error('[inject-static-content] Could not find <div id="root"> in dist/index.html. Skipping.');
  process.exit(1);
}

const CURRENT_YEAR = String(new Date().getFullYear());

const PLACEHOLDER = '<div id="root">';
if (html.includes(`${PLACEHOLDER}</div>`)) {
  // Already empty root — safe to inject
  html = html.replace(`${PLACEHOLDER}</div>`, `${PLACEHOLDER}\n  ${STATIC_CONTENT}\n</div>`);
} else if (html.includes(PLACEHOLDER)) {
  // Root has content already (e.g. previous run). Replace up to first </div> after root.
  const rootStart = html.indexOf(PLACEHOLDER);
  const afterRoot = html.indexOf("</div>", rootStart + PLACEHOLDER.length);
  if (afterRoot === -1) {
    console.error("[inject-static-content] Malformed HTML structure. Skipping.");
    process.exit(1);
  }
  html = html.slice(0, rootStart + PLACEHOLDER.length) + "\n  " + STATIC_CONTENT + "\n" + html.slice(afterRoot);
} else {
  console.error('[inject-static-content] <div id="root"> not found. Skipping.');
  process.exit(1);
}

// Replace build-time placeholders (e.g. copyright year in noscript and injected footer)
html = html.replace(/\{\{CURRENT_YEAR\}\}/g, CURRENT_YEAR);

fs.writeFileSync(DIST_HTML, html, "utf8");
console.log("[inject-static-content] Static content injected and placeholders applied in dist/index.html successfully.");

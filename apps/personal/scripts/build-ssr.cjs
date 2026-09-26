process.env.BUILD_SSR = "1";
const path = require("path");
const { execSync } = require("child_process");
// SSR-bundle buiten dist/: dist/ is de publieke Vercel-output (security 2026-09-23: /entry-server.js was publiek).
execSync("npx vite build --ssr src/entry-server.tsx --outDir dist-ssr", { stdio: "inherit", shell: true, cwd: path.resolve(__dirname, "..") });

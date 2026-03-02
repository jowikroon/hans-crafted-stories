process.env.BUILD_SSR = "1";
const path = require("path");
const { execSync } = require("child_process");
execSync("npx vite build --ssr src/entry-server.tsx", { stdio: "inherit", shell: true, cwd: path.resolve(__dirname, "..") });

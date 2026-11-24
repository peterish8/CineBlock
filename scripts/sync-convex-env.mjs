// Copies CineBlock's server secrets from .env.local onto the Convex deployment this
// folder is linked to, and points NEXT_PUBLIC_CONVEX_SITE_URL at that deployment.
// Secret values are never printed.
//
// Usage (from the repo root):
//   node scripts/sync-convex-env.mjs          dev deployment
//   node scripts/sync-convex-env.mjs --prod   production deployment
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env.local");
const CLI = join(ROOT, "node_modules", "convex", "bin", "main.js");
const PROD = process.argv.includes("--prod");

/** Secrets the Convex backend reads (see convex/auth.ts, convex/news.ts, convex/franchises.ts). */
const SECRETS = ["TMDB_API_KEY", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "INTERNAL_API_SECRET"];

if (!existsSync(ENV_FILE) || !existsSync(CLI)) {
  console.error("Run this from the CineBlock repo root after installing dependencies.");
  process.exit(1);
}

let text = readFileSync(ENV_FILE, "utf8");
const env = new Map();
for (const line of text.split(/\r?\n/)) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
  if (match) {
    env.set(match[1], match[2].replace(/^(["'])(.*)\1$/, "$2"));
  }
}

function setLine(name, value) {
  const pattern = new RegExp(`^${name}=.*$`, "m");
  text = pattern.test(text) ? text.replace(pattern, `${name}=${value}`) : `${text.trimEnd()}\n${name}=${value}\n`;
  env.set(name, value);
}

let fileChanged = false;

// Keep the site URL on the same deployment as the cloud URL (the CLI only rewrites the cloud URL).
const cloudUrl = env.get("NEXT_PUBLIC_CONVEX_URL") ?? "";
if (!PROD && cloudUrl.endsWith(".convex.cloud")) {
  const siteUrl = cloudUrl.replace(/\.convex\.cloud$/, ".convex.site");
  if (env.get("NEXT_PUBLIC_CONVEX_SITE_URL") !== siteUrl) {
    setLine("NEXT_PUBLIC_CONVEX_SITE_URL", siteUrl);
    fileChanged = true;
    console.log(`.env.local: NEXT_PUBLIC_CONVEX_SITE_URL -> ${siteUrl}`);
  }
}

// Convex and the Next.js app must share this secret, so create one if it's missing.
if (!env.get("INTERNAL_API_SECRET")) {
  setLine("INTERNAL_API_SECRET", randomBytes(32).toString("hex"));
  fileChanged = true;
  console.log(".env.local: created INTERNAL_API_SECRET");
}

if (fileChanged) {
  writeFileSync(ENV_FILE, text);
}

const target = PROD ? ["--prod"] : [];
const missing = [];
let failed = false;

function setConvexEnv(name, value) {
  // No shell is involved; `--` stops values that start with "-" being read as flags.
  const result = spawnSync(process.execPath, [CLI, "env", "set", ...target, name, "--", value], {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (result.status === 0) {
    console.log(`Convex${PROD ? " (prod)" : ""}: set ${name}`);
  } else {
    failed = true;
    console.error(`Convex: could not set ${name}`);
  }
}

for (const name of SECRETS) {
  const value = env.get(name);
  if (value) setConvexEnv(name, value);
  else missing.push(name);
}

// The unverified test-account sign-in (convex/auth.ts) is for local development only.
if (!PROD) setConvexEnv("ENABLE_PASSWORD_AUTH", "true");

if (missing.length > 0) {
  console.log(`\nNot in .env.local, so not copied: ${missing.join(", ")}`);
  console.log(`Set each one with: npx convex env set${PROD ? " --prod" : ""} NAME value`);
} else if (!failed) {
  console.log("\nAll secrets copied.");
}
process.exit(failed ? 1 : 0);

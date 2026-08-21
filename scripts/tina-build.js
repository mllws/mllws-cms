#!/usr/bin/env node
const { spawnSync } = require("node:child_process");

// next-auth throws on NEXTAUTH_URL="" (blank Vercel env). Fill a valid URL
// before the Tina CLI loads config.ts.
if (!process.env.NEXTAUTH_URL?.trim()) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/tina/auth`
    : "http://localhost:3003/api/tina/auth";
}

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
const args = ["build"];
if (!isLocal) args.push("--partial-reindex");

const result = spawnSync("tinacms", args, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);

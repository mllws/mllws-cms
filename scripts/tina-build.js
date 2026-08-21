#!/usr/bin/env node
const { spawnSync } = require("node:child_process");

function withTinaAuthPath(raw) {
  const trimmed = raw.replace(/\/$/, "");
  if (trimmed.endsWith("/api/tina/auth")) return trimmed;
  return `${trimmed}/api/tina/auth`;
}

if (process.env.NEXTAUTH_URL?.trim()) {
  process.env.NEXTAUTH_URL = withTinaAuthPath(process.env.NEXTAUTH_URL.trim());
} else {
  process.env.NEXTAUTH_URL = withTinaAuthPath(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3003"
  );
}

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
// Full index so content/users from mllws-blog is hashed into Redis on each deploy.
const args = ["build"];

const result = spawnSync("tinacms", args, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);

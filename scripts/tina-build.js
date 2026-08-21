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

const fetch = spawnSync("node", ["scripts/fetch-blog-content.js"], {
  stdio: "inherit",
  env: process.env,
});
if (fetch.status) {
  process.exit(fetch.status === null ? 1 : fetch.status);
}

// Full index so copied mllws-blog users are hashed into Redis on each deploy.
const args = ["build"];

const result = spawnSync("tinacms", args, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);

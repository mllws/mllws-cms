#!/usr/bin/env node
/**
 * Copies MDX collections from the sibling mllws-blog repo into this CMS
 * working tree so `TINA_PUBLIC_IS_LOCAL=true` can edit files on disk.
 *
 * Production (`npm run dev:prod` / Vercel) talks to GitHub directly and
 * does not need this copy — saves go to mllws-blog via the GitHub API.
 */

const fs = require("node:fs");
const path = require("node:path");

const COLLECTIONS = ["posts", "events", "stories", "galleries"];
const blogRoot = path.resolve(__dirname, "..", "..", "mllws-blog");
const destRoot = path.resolve(__dirname, "..", "content");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

for (const name of COLLECTIONS) {
  ensureDir(path.join(destRoot, name));
}

if (!fs.existsSync(blogRoot)) {
  console.log("[sync-content] Sibling mllws-blog not found — skipping.");
  process.exit(0);
}

let copied = 0;
for (const name of COLLECTIONS) {
  const src = path.join(blogRoot, "content", name);
  const dest = path.join(destRoot, name);
  if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) {
    console.log(`[sync-content] No content/${name}/ in mllws-blog — skipping.`);
    continue;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  copied += 1;
  console.log(`[sync-content] Copied content/${name}/`);
}

const usersSrc = path.join(blogRoot, "content", "users");
const usersDest = path.join(destRoot, "users");
if (fs.existsSync(usersSrc) && fs.statSync(usersSrc).isDirectory()) {
  const seed = path.join(usersDest, "index.json");
  if (!fs.existsSync(seed)) {
    fs.cpSync(usersSrc, usersDest, { recursive: true });
    console.log("[sync-content] Copied content/users/");
  }
}

if (copied === 0) {
  console.log("[sync-content] No collections copied.");
}

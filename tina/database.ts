import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createDatabase, createLocalDatabase } from "@tinacms/datalayer";
import { RedisLevel } from "upstash-redis-level";
import { GitHubProvider } from "tinacms-gitprovider-github";

// Tina CLI does not load Next.js .env.local. Keep existing process.env
// (so `npm run dev:prod` can force TINA_PUBLIC_IS_LOCAL=false).
function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

function env(name: string) {
  const value = process.env[name];
  if (!value) return undefined;
  return value.replace(/^['"]|['"]$/g, "");
}

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

// Always target the private content repo — never the CMS app repo.
// VERCEL_GIT_REPO_* would point at mllws-cms on a Vercel deploy.
const owner = env("GITHUB_OWNER") || "mllws";
const repo = env("GITHUB_REPO") || "mllws-blog";
const branch = env("GITHUB_BRANCH") || "main";
const token = env("GITHUB_PERSONAL_ACCESS_TOKEN");

const redisUrl = env("KV_REST_API_URL") || env("UPSTASH_REDIS_REST_URL");
const redisToken = env("KV_REST_API_TOKEN") || env("UPSTASH_REDIS_REST_TOKEN");

// Users are detached and stored in Redis `_appData`, which is NOT under
// createDatabase's content namespace. RedisLevel `namespace` prefixes the
// actual Redis hash (`level:h` by default), so bumping this is what reseeds
// the admin user from mllws-blog.
const redisNamespace = env("TINA_INDEX_NAMESPACE") || "mllws-cms-v2";

if (!isLocal && (!token || !redisUrl || !redisToken)) {
  const missing = [
    !token && "GITHUB_PERSONAL_ACCESS_TOKEN",
    !redisUrl && "KV_REST_API_URL (or UPSTASH_REDIS_REST_URL)",
    !redisToken && "KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_TOKEN)",
  ].filter(Boolean);
  throw new Error(
    `dev:prod needs GitHub + Upstash Redis. Missing: ${missing.join(
      ", "
    )}. Create a free Redis database at https://console.upstash.com/redis and paste the REST URL and token into .env.local.`
  );
}

export default isLocal
  ? createLocalDatabase()
  : createDatabase({
      gitProvider: new GitHubProvider({
        branch,
        owner,
        repo,
        token: token as string,
      }),
      databaseAdapter: new RedisLevel<string, Record<string, unknown>>({
        redis: {
          url: redisUrl as string,
          token: redisToken as string,
        },
        namespace: redisNamespace,
        debug: process.env.DEBUG === "true" || false,
      }),
      namespace: branch,
    });

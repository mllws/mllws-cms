import { createDatabase, createLocalDatabase } from "@tinacms/datalayer";
import { RedisLevel } from "upstash-redis-level";
import { GitHubProvider } from "tinacms-gitprovider-github";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

// Always target the private content repo — never the CMS app repo.
// VERCEL_GIT_REPO_* would point at mllws-cms on a Vercel deploy.
const owner = process.env.GITHUB_OWNER || "mllws";
const repo = process.env.GITHUB_REPO || "mllws-blog";
const branch = process.env.GITHUB_BRANCH || "main";
const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN as string;

const redisUrl =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export default isLocal
  ? createLocalDatabase()
  : createDatabase({
      gitProvider: new GitHubProvider({
        branch,
        owner,
        repo,
        token,
      }),
      databaseAdapter: new RedisLevel<string, Record<string, unknown>>({
        redis: {
          url: redisUrl || "http://localhost:8079",
          token: redisToken || "example_token",
        },
        debug: process.env.DEBUG === "true" || false,
      }),
      namespace: branch,
    });

#!/usr/bin/env node
const { spawnSync } = require("node:child_process");

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
const args = ["build"];
if (!isLocal) args.push("--partial-reindex");

const result = spawnSync("tinacms", args, { stdio: "inherit", shell: true });
process.exit(result.status === null ? 1 : result.status);

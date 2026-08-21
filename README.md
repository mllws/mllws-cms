# mllws-cms

Self-hosted [TinaCMS](https://tina.io) editor for MLLWS content.

This GitHub repo can be **public** (needed for Vercel Hobby). It is still **not**
the public website, and it must **not** contain posts, drafts, or secrets.

Content lives in the **private** [`mllws-blog`](https://github.com/mllws/mllws-blog)
repo. The public website clones that repo at build time. This app only writes
there through a GitHub token stored in Vercel, never in git.

## Where secrets live

| Place | What goes there |
|---|---|
| **Vercel → this CMS project → Settings → Environment Variables** | Production/preview secrets (the real store) |
| **`mllws-cms/.env.local`** | Local copies. Gitignored. Never commit. |
| **Password manager** | Backup of the GitHub PAT and `NEXTAUTH_SECRET` |
| **This GitHub repo** | Nothing secret. `.env.example` has empty names only. |
| **Public website Vercel project** | Only the read-only `BLOG_CONTENT_TOKEN`. Never the CMS write PAT. |

Copy `.env.example` to `.env.local` for laptop use. On Vercel, add the same
**names** with real values. Do not paste tokens into README, issues, or git.

## Public repo vs private content

| Repo | Visibility | Why |
|---|---|---|
| `mllws-cms` (this app) | Public | Vercel Hobby cannot deploy private GitHub repos |
| `mllws-blog` | **Private** | MDX, drafts, CMS users |
| `mllws-website` | Public | The nonprofit site |

A public CMS repo exposes editor **code**, not unpublished articles. `/admin`
on the live CMS URL must still be behind Tina login **and** Vercel Deployment
Protection.

## Auth

Tina Auth.js username/password. First production user is seeded from private
`mllws-blog` `content/users/index.json` into Redis **only when that Redis
namespace is empty**. After that, password hashes live in Redis, not Git.
If login rejects the seed password, bump `TINA_INDEX_NAMESPACE` (or flush
that Redis database) and redeploy.

Vercel Deployment Protection (password or SSO) is a second gate in front of the
whole deploy. Use it once the CMS URL is on the internet.

## What talks to what

```
Editor  →  this CMS (/admin)
              ├─ Auth.js session
              ├─ Vercel Blob  (new photos)
              ├─ Upstash Redis (Tina index cache)
              └─ GitHub commit to mllws-blog
                     └─ Deploy Hook rebuilds mllws-website
```

Images are HTTPS URLs in MDX (Blob or existing `motherlanguagelovers.com` files).
Do not commit photo binaries to Git.

## Local development

Needs Node 20+ and the sibling `mllws-blog` folder.

```bash
cp .env.example .env.local
# set NEXTAUTH_SECRET: openssl rand -base64 32
npm install
npm run dev
```

Then open http://localhost:3003/admin

`npm run dev` sets `TINA_PUBLIC_IS_LOCAL=true` (no login, disk saves).

GitHub + Auth.js + Redis + Blob:

```bash
npm run dev:prod
```

## Vercel deploy (Hobby, public GitHub)

1. GitHub: set `mllws/mllws-cms` to **Public**. Keep `mllws-blog` **Private**.
2. Vercel: **Add New → Project** → import `mllws/mllws-cms` as its **own**
   project. Do not add it to the website project.
3. Framework: Next.js. Build command can stay `npm run build`.
4. Environment variables for Production **and** Preview:

   | Name | Value |
   |---|---|
   | `TINA_PUBLIC_IS_LOCAL` | `false` |
   | `GITHUB_PERSONAL_ACCESS_TOKEN` | write PAT, `mllws-blog` only |
   | `GITHUB_OWNER` | `mllws` |
   | `GITHUB_REPO` | `mllws-blog` |
   | `GITHUB_BRANCH` | `main` |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` (new, not the laptop one) |
   | `NEXTAUTH_URL` | `https://<this-project>.vercel.app/api/tina/auth` |
   | `UPSTASH_REDIS_REST_URL` | from Upstash |
   | `UPSTASH_REDIS_REST_TOKEN` | from Upstash |
   | `BLOB_READ_WRITE_TOKEN` | from the Blob store |

5. Project Settings → Deployment Protection → on.
6. Optional domain: `cms.motherlanguagelovers.com`. Then set `NEXTAUTH_URL` to
   that HTTPS origin and redeploy.

Put the seed user on **`mllws-blog` `main`** (`content/users/index.json`) before
the first production login. This public repo’s `content/users/index.json` is
empty on purpose.

Saving in Tina still commits to private `mllws-blog`, which should already
trigger the website Deploy Hook.

## GitHub token

Fine-grained PAT: **Contents: Read and write** on `mllws/mllws-blog` only. Not
the same as the website’s read-only `BLOG_CONTENT_TOKEN`.

## Collections

| Admin label | Git path (in private `mllws-blog`) |
|---|---|
| Blog posts | `content/posts/*.mdx` |
| Events | `content/events/*.mdx` |
| Stories | `content/stories/*.mdx` |
| Photo galleries | `content/galleries/*.mdx` |
| Users | `content/users/index.json` |

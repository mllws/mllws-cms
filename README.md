# mllws-cms

Private, self-hosted [TinaCMS](https://tina.io) editor for MLLWS content.

This app is **not** the public website. It writes MDX into the private
[`mllws-blog`](https://github.com/mllws/mllws-blog) repo. The public site still
clones that repo at build time.

## Auth: Auth.js, not Vercel login

Use **Tina’s Auth.js username/password**. That is the right fit for board
members and volunteers who should not need GitHub or Vercel accounts.

Vercel does **not** provide a general-purpose auth server for your app’s users.
What Vercel does offer:

| Vercel feature | Use here? |
|---|---|
| **Deployment Protection** (site password / SSO) | Optional second gate in front of the whole CMS deploy |
| **Sign in with Vercel** | No — that authenticates Vercel team members, not content editors |
| **Clerk / Auth0 (Marketplace)** | Possible later; extra vendor, not wired into Tina’s user collection |

After first login, Tina will require changing the seed password. Add more
editors under **Users** in the admin sidebar. Password hashes live in Redis, not
in Git.

Seed user (change immediately):

- username: `admin`
- password: `ChangeMeNow!`

## What talks to what

```
Editor  →  this CMS (/admin)
              ├─ Auth.js session
              ├─ Vercel Blob  (new photos)
              ├─ Upstash Redis (Tina index cache)
              └─ GitHub commit to mllws-blog
                     └─ Deploy Hook rebuilds mllws-website
```

Images are stored as HTTPS URLs in MDX (Blob or existing
`motherlanguagelovers.com` files). Do not commit photo binaries to Git.

## Local development

Needs Node 20+ and the sibling `mllws-blog` folder.

```bash
cp .env.example .env.local
# set NEXTAUTH_SECRET even for local: openssl rand -base64 32
npm install
npm run dev
```

Then open http://localhost:3003/admin

`npm run dev` sets `TINA_PUBLIC_IS_LOCAL=true`:

- no login
- saves write to the copied `content/` files on disk
- `scripts/sync-content.js` copies posts/events/stories/galleries from
  `../mllws-blog` on each `predev`

To test GitHub + Auth.js + Redis + Blob the way production works:

```bash
# in .env.local:
# TINA_PUBLIC_IS_LOCAL=false
# GITHUB_PERSONAL_ACCESS_TOKEN=  (write on mllws-blog only)
# KV_REST_API_URL= / KV_REST_API_TOKEN=   (or UPSTASH_REDIS_REST_*)
# BLOB_READ_WRITE_TOKEN=
# NEXTAUTH_SECRET=
# NEXTAUTH_URL=http://localhost:3003
npm run dev:prod
```

Local Blob `onUploadCompleted` callbacks do not fire without a public tunnel.
Uploads through this handler use server `put()`, so local uploads work as long
as `BLOB_READ_WRITE_TOKEN` is set.

## GitHub token

Create a **fine-grained** PAT (or GitHub App) with **Contents: Read and write**
on `mllws/mllws-blog` only. This is a different secret from the website’s
read-only `BLOG_CONTENT_TOKEN`.

If `mllws-blog` `main` requires pull requests, Tina saves will fail unless this
token can bypass branch protection. For a small editor team, allow direct pushes
to `main` on the content repo.

## Vercel deploy

1. Create a **private** GitHub repo `mllws/mllws-cms` and push this project.
2. Import it as a new Vercel project (Hobby is enough).
3. Create an Upstash Redis database (free tier is enough). Prefer Vercel
   Marketplace → Upstash, or paste `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
4. Create a **public** Vercel Blob store. Attach the read-write token to **this**
   project. The public website already allowlists
   `*.public.blob.vercel-storage.com`.
5. Set environment variables (Production + Preview):

   | Name | Notes |
   |---|---|
   | `TINA_PUBLIC_IS_LOCAL` | `false` |
   | `GITHUB_PERSONAL_ACCESS_TOKEN` | write token for `mllws-blog` |
   | `GITHUB_OWNER` | `mllws` |
   | `GITHUB_REPO` | `mllws-blog` |
   | `GITHUB_BRANCH` | `main` |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://<your-cms-domain>` |
   | `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash |
   | `BLOB_READ_WRITE_TOKEN` | Blob store |

6. Optional: custom domain `cms.motherlanguagelovers.com` plus Vercel
   Deployment Protection.
7. Keep this Vercel project **private**. Do not put the write PAT on the public
   website project.

A push to `mllws-blog` should already trigger the website Deploy Hook. Saving in
Tina commits there, so the public site updates without touching this CMS repo.

## Draft vs publish

Leave **Draft** on until the piece should go live. Drafts can live on `main` in
the private content repo; the public site hides them. Turning Draft off and
saving publishes on the next website rebuild (~1–2 minutes).

## Collections

| Admin label | Git path |
|---|---|
| Blog posts | `content/posts/*.mdx` |
| Events | `content/events/*.mdx` |
| Stories | `content/stories/*.mdx` |
| Photo galleries | `content/galleries/*.mdx` |
| Users | `content/users/index.json` (seed only; passwords are not committed after change) |

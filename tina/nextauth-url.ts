// next-auth/react calls `new URL(NEXTAUTH_URL)` at import time.
// An empty Vercel env value is `""`, which throws ERR_INVALID_URL.
const url = process.env.NEXTAUTH_URL?.trim();
if (!url) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/tina/auth`
    : "http://localhost:3003/api/tina/auth";
}

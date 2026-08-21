// next-auth/react calls `new URL(NEXTAUTH_URL)` at import time.
// An empty Vercel env value is `""`, which throws ERR_INVALID_URL.
// The admin bundle also needs the Tina Auth.js path, not just the origin.
function withTinaAuthPath(raw) {
  const trimmed = raw.replace(/\/$/, "");
  if (trimmed.endsWith("/api/tina/auth")) return trimmed;
  return `${trimmed}/api/tina/auth`;
}

const url = process.env.NEXTAUTH_URL?.trim();
if (url) {
  process.env.NEXTAUTH_URL = withTinaAuthPath(url);
} else {
  process.env.NEXTAUTH_URL = withTinaAuthPath(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3003"
  );
}

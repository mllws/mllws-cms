import type { NextApiRequest, NextApiResponse } from "next";
import { TinaNodeBackend, LocalBackendAuthProvider } from "@tinacms/datalayer";
import { TinaAuthJSOptions, AuthJsBackendAuthProvider } from "tinacms-authjs";
import databaseClient from "../../../tina/__generated__/databaseClient";

if (!process.env.NEXTAUTH_URL?.trim() && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}/api/tina/auth`;
}

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const handler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient,
          secret: process.env.NEXTAUTH_SECRET || "",
        }),
      }),
  databaseClient,
});

export default function tinaHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!isLocal && !process.env.NEXTAUTH_SECRET?.trim()) {
    res.status(500).json({
      error:
        "NEXTAUTH_SECRET is not set on this Vercel project. Add it under Settings → Environment Variables, then redeploy. It is a cookie-signing key, not the Tina login password.",
    });
    return;
  }
  return handler(req, res);
}

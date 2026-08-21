import { NextResponse } from "next/server";
import { TinaNodeBackend, LocalBackendAuthProvider } from "@tinacms/datalayer";
import { TinaAuthJSOptions, AuthJsBackendAuthProvider } from "tinacms-authjs";
import { runNodeApiHandler } from "../../../../lib/run-node-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function tinaHandler() {
  const databaseClient = (await import("../../../../tina/__generated__/databaseClient"))
    .default;
  const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
  return TinaNodeBackend({
    authProvider: isLocal
      ? LocalBackendAuthProvider()
      : AuthJsBackendAuthProvider({
          authOptions: TinaAuthJSOptions({
            databaseClient,
            secret: process.env.NEXTAUTH_SECRET,
          }),
        }),
    databaseClient,
  });
}

async function handle(request) {
  try {
    if (!process.env.NEXTAUTH_URL?.trim() && process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}/api/tina/auth`;
    }
    if (process.env.TINA_PUBLIC_IS_LOCAL !== "true" && !process.env.NEXTAUTH_SECRET?.trim()) {
      return NextResponse.json(
        {
          error:
            "NEXTAUTH_SECRET is not set on this Vercel project. Add it under Settings → Environment Variables, then redeploy. It is a cookie-signing key, not the Tina login password.",
        },
        { status: 500 }
      );
    }
    const handler = await tinaHandler();
    return await runNodeApiHandler(handler, request);
  } catch (error) {
    console.error("Tina backend failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Tina backend failed to start",
      },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

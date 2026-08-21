import { del, list, put } from "@vercel/blob";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAX_BYTES = 25 * 1024 * 1024;

function mediaRoot() {
  return (process.env.BLOB_PREFIX || "mllws").replace(/^\/+|\/+$/g, "");
}

function joinPath(...parts: string[]) {
  return parts
    .flatMap((part) => part.split("/"))
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

function toTinaMedia(blob: { url: string; pathname: string }) {
  const relative = stripRoot(blob.pathname);
  const filename = relative.split("/").pop() || relative;
  const directory = relative.includes("/")
    ? relative.slice(0, relative.lastIndexOf("/") + 1)
    : "";

  return {
    id: blob.url,
    type: "file" as const,
    filename,
    directory,
    src: blob.url,
    previewSrc: blob.url,
    thumbnails: {
      "75x75": blob.url,
      "400x400": blob.url,
      "1000x1000": blob.url,
    },
  };
}

function stripRoot(pathname: string) {
  const root = `${mediaRoot()}/`;
  return pathname.startsWith(root) ? pathname.slice(root.length) : pathname;
}

async function isAuthorized(req: NextRequest) {
  if (process.env.TINA_PUBLIC_IS_LOCAL === "true") return true;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return Boolean(token);
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ items: [], offset: undefined });
  }

  const directory = (req.nextUrl.searchParams.get("directory") || "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\./g, "");
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") || 200) || 200,
    1000
  );
  const offset = req.nextUrl.searchParams.get("offset") || undefined;

  const prefix = joinPath(mediaRoot(), directory);
  const listed = await list({
    prefix: prefix ? `${prefix}/` : `${mediaRoot()}/`,
    limit,
    cursor: offset,
  });

  const dirSet = new Set<string>();
  const files: ReturnType<typeof toTinaMedia>[] = [];
  const dirPrefix = prefix ? `${prefix}/` : `${mediaRoot()}/`;

  for (const blob of listed.blobs) {
    const rest = blob.pathname.startsWith(dirPrefix)
      ? blob.pathname.slice(dirPrefix.length)
      : stripRoot(blob.pathname);
    if (!rest) continue;

    const slash = rest.indexOf("/");
    if (slash === -1) {
      files.push(toTinaMedia(blob));
    } else {
      const dirName = rest.slice(0, slash);
      dirSet.add(dirName);
    }
  }

  const dirs = [...dirSet].sort().map((name) => ({
    id: joinPath(directory, name),
    type: "dir" as const,
    filename: name,
    directory: directory ? `${directory}/` : "",
  }));

  return NextResponse.json({
    items: [...dirs, ...files],
    offset: listed.hasMore ? listed.cursor : undefined,
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { message: "BLOB_READ_WRITE_TOKEN is not set" },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: "Image is larger than 25 MB" },
      { status: 400 }
    );
  }

  const type = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { message: `Unsupported file type: ${type}` },
      { status: 400 }
    );
  }

  const directory = String(form.get("directory") || "uploads").replace(
    /\.\./g,
    ""
  );
  const filename = String(form.get("filename") || file.name).replace(
    /[^a-zA-Z0-9._-]/g,
    "-"
  );
  const pathname = joinPath(mediaRoot(), directory, filename);

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: type,
  });

  return NextResponse.json(toTinaMedia(blob));
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  await del(id);
  return NextResponse.json({ ok: true });
}

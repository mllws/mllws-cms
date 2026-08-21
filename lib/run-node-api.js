/**
 * Run a Node.js (req, res) handler from a Web Request.
 * TinaNodeBackend and NextAuth v4 still expect the Pages API shape.
 */
export async function runNodeApiHandler(handler, request) {
  const url = new URL(request.url);
  const buf = Buffer.from(await request.arrayBuffer());
  const contentType = request.headers.get("content-type") || "";
  let body;
  if (buf.length) {
    const text = buf.toString("utf8");
    if (contentType.includes("application/json")) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      body = text;
    }
  }

  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  headers.host = headers.host || url.host;

  const cookies = {};
  const cookieHeader = headers.cookie || "";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    cookies[trimmed.slice(0, eq)] = decodeURIComponent(trimmed.slice(eq + 1));
  }

  const req = {
    method: request.method,
    url: `${url.pathname}${url.search}`,
    headers,
    body,
    query: Object.fromEntries(url.searchParams),
    cookies,
    socket: { encrypted: url.protocol === "https:" },
  };

  return new Promise((resolve, reject) => {
    let resolved = false;
    const chunks = [];
    const outHeaders = new Headers();
    const res = {
      statusCode: 200,
      writableEnded: false,
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(name, value) {
        const key = String(name).toLowerCase();
        if (key === "set-cookie") {
          const list = Array.isArray(value) ? value : [value];
          for (const cookie of list) outHeaders.append("set-cookie", String(cookie));
          return this;
        }
        outHeaders.set(name, Array.isArray(value) ? value.join(", ") : String(value));
        return this;
      },
      getHeader(name) {
        const key = String(name).toLowerCase();
        if (key === "set-cookie") return outHeaders.getSetCookie?.() || outHeaders.get(name);
        return outHeaders.get(name) ?? undefined;
      },
      getHeaders() {
        return Object.fromEntries(outHeaders.entries());
      },
      removeHeader(name) {
        outHeaders.delete(name);
        return this;
      },
      writeHead(status, maybeHeaders) {
        this.statusCode = status;
        if (maybeHeaders && typeof maybeHeaders === "object") {
          for (const [key, value] of Object.entries(maybeHeaders)) {
            this.setHeader(key, value);
          }
        }
        return this;
      },
      write(chunk) {
        if (chunk != null) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        return true;
      },
      send(data) {
        if (typeof data === "object" && data !== null && !Buffer.isBuffer(data)) {
          this.setHeader("content-type", "application/json; charset=utf-8");
          chunks.push(Buffer.from(JSON.stringify(data)));
        } else if (data != null) {
          chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(String(data)));
        }
        return this.end();
      },
      json(data) {
        this.setHeader("content-type", "application/json; charset=utf-8");
        chunks.push(Buffer.from(JSON.stringify(data)));
        return this.end();
      },
      redirect(statusOrUrl, urlMaybe) {
        const status = typeof statusOrUrl === "number" ? statusOrUrl : 302;
        const location = typeof statusOrUrl === "number" ? urlMaybe : statusOrUrl;
        this.statusCode = status;
        this.setHeader("location", location);
        return this.end();
      },
      end(chunk) {
        if (this.writableEnded) return this;
        if (chunk != null) this.write(chunk);
        this.writableEnded = true;
        if (resolved) return this;
        resolved = true;
        resolve(
          new Response(Buffer.concat(chunks), {
            status: this.statusCode,
            headers: outHeaders,
          })
        );
        return this;
      },
    };

    Promise.resolve(handler(req, res)).catch(reject);
  });
}

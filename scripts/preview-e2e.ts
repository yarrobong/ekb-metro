import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const HOST = "127.0.0.1";
const PORT = 4173;
const DIST_DIR = resolve("dist");
const SITE_BASE_PATH = "/ekb-metro/";

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function resolveRequestPath(urlPath: string): string | null {
  if (urlPath === "/") {
    return "/index.html";
  }

  if (!urlPath.startsWith(SITE_BASE_PATH)) {
    return null;
  }

  const relativePath = urlPath.slice(SITE_BASE_PATH.length - 1) || "/";
  return relativePath === "/" ? "/index.html" : relativePath;
}

function resolveFilePath(urlPath: string): string | null {
  const requestPath = resolveRequestPath(urlPath);
  if (!requestPath) {
    return null;
  }

  const normalizedPath = normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidatePath = join(DIST_DIR, normalizedPath);

  if (existsSync(candidatePath)) {
    return candidatePath;
  }

  if (!extname(normalizedPath)) {
    const spaEntryPath = join(DIST_DIR, "index.html");
    if (existsSync(spaEntryPath)) {
      return spaEntryPath;
    }
  }

  return null;
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) {
  const requestUrl = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
  const filePath = resolveFilePath(requestUrl.pathname);

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const fileStats = await stat(filePath);
  const extension = extname(filePath);
  const contentType = contentTypes[extension] ?? "application/octet-stream";

  response.writeHead(200, {
    "Content-Length": fileStats.size,
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  });

  createReadStream(filePath).pipe(response);
}

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

server.listen(PORT, HOST, () => {
  process.stdout.write(
    `E2E preview server listening on http://${HOST}:${PORT}${SITE_BASE_PATH}\n`,
  );
});

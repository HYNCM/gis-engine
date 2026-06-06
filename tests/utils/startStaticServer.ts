import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

export interface StaticServerHandle {
  url: string;
  close(): Promise<void>;
}

export async function startStaticServer(root: string): Promise<StaticServerHandle> {
  const rootPath = resolve(root);
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
    const filePath = resolve(join(rootPath, normalize(pathname)));

    if (!filePath.startsWith(rootPath)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const body = await readFile(filePath);
      response.writeHead(200, { "content-type": contentType(filePath) });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  await listen(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to bind static server.");

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose) => server.close(() => resolveClose())),
  };
}

function listen(server: Server): Promise<void> {
  return new Promise((resolveListen) => server.listen(0, "127.0.0.1", () => resolveListen()));
}

function contentType(filePath: string): string {
  if (extname(filePath) === ".json" || extname(filePath) === ".geojson") return "application/json";
  if (extname(filePath) === ".html") return "text/html";
  if (extname(filePath) === ".js") return "text/javascript";
  return "application/octet-stream";
}

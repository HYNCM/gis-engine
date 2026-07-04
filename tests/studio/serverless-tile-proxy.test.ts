import { describe, expect, it, vi } from "vitest";
import handler from "../../api/[...path]";

type MockReq = {
  headers: Record<string, string>;
  method: string;
  query?: Record<string, string | string[]>;
  url?: string;
};

type MockRes = {
  body: unknown;
  ended: boolean;
  headers: Record<string, string>;
  statusCode: number;
  end: () => void;
  json: (body: unknown) => MockRes;
  send: (body: Buffer | string) => MockRes;
  setHeader: (name: string, value: number | string) => void;
  status: (code: number) => MockRes;
};

function createRes(): MockRes {
  return {
    body: undefined,
    ended: false,
    headers: {},
    statusCode: 200,
    end() {
      this.ended = true;
    },
    json(body: unknown) {
      this.body = body;
      this.ended = true;
      return this;
    },
    send(body: Buffer | string) {
      this.body = body;
      this.ended = true;
      return this;
    },
    setHeader(name: string, value: number | string) {
      this.headers[name.toLowerCase()] = String(value);
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
  };
}

function createReq(overrides: Partial<MockReq>): MockReq {
  return {
    headers: { host: "localhost" },
    method: "GET",
    ...overrides,
  };
}

describe("serverless tile proxy catch-all route", () => {
  it("proxies Vercel catch-all tile query segments through the root /api handler", async () => {
    const tileBody = Buffer.from("png-tile");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "image/png" }),
      arrayBuffer: () =>
        Promise.resolve(tileBody.buffer.slice(tileBody.byteOffset, tileBody.byteOffset + tileBody.byteLength)),
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = createRes();

    await handler(createReq({ query: { path: ["tiles", "osm", "0", "0", "0.png"] } }) as never, res as never);

    expect(fetchMock).toHaveBeenCalledWith("https://tile.openstreetmap.org/0/0/0.png", {
      headers: {
        "User-Agent": "GIS Engine Studio/0.1 (explicit user-selected basemap proxy)",
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers).toMatchObject({
      "access-control-allow-origin": "*",
      "content-type": "image/png",
      "cache-control": "public, max-age=86400, s-maxage=86400",
      "content-length": String(tileBody.byteLength),
    });
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect((res.body as Buffer).toString("utf8")).toBe("png-tile");

    vi.unstubAllGlobals();
  });

  it("falls back to req.url parsing for local /api/tiles requests", async () => {
    const tileBody = Buffer.from("local-url-tile");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "image/png" }),
      arrayBuffer: () =>
        Promise.resolve(tileBody.buffer.slice(tileBody.byteOffset, tileBody.byteOffset + tileBody.byteLength)),
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = createRes();

    await handler(createReq({ url: "/api/tiles/osm/0/0/0.png" }) as never, res as never);

    expect(fetchMock).toHaveBeenCalledWith("https://tile.openstreetmap.org/0/0/0.png", expect.any(Object));
    expect(res.statusCode).toBe(200);
    expect((res.body as Buffer).toString("utf8")).toBe("local-url-tile");

    vi.unstubAllGlobals();
  });

  it("returns 404 for unknown catch-all routes without fetching upstream resources", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = createRes();

    await handler(createReq({ query: { path: ["unknown"] } }) as never, res as never);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });

    vi.unstubAllGlobals();
  });
});

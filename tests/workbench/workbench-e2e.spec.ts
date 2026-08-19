import { type ChildProcess, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

let projectRoot = "";
let server: ChildProcess | undefined;
let serverOutput = "";
let baseUrl = "";

test.beforeAll(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), "gis-engine-workbench-e2e-"));
  const port = await reservePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ["apps/workbench/server/index.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      WORKBENCH_PROJECT_ROOT: projectRoot,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk) => {
    serverOutput += String(chunk);
  });
  server.stderr?.on("data", (chunk) => {
    serverOutput += String(chunk);
  });
  await waitForServer(baseUrl);
});

test.afterAll(async () => {
  server?.kill("SIGTERM");
  if (server && server.exitCode === null) {
    await Promise.race([
      new Promise<void>((resolve) => server?.once("exit", () => resolve())),
      new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
    ]);
  }
  if (projectRoot) await rm(projectRoot, { recursive: true, force: true });
});

test("completes the local Workbench golden path with explicit preview and write confirmation", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  const projectExplorer = page.getByRole("complementary", { name: "Project explorer" });
  await expect(page.locator("header code")).toHaveText("rev 0");
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(await page.locator("canvas").evaluate((canvas) => canvas.width)).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Inspect data", exact: true }).click();
  await expect(page.getByText("2 features", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Generate plan", exact: true }).click();
  await expect(page.getByText("Reviewed input", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Preview changes", exact: true }).click();
  await expect(page.getByText("Revision diff", { exact: true })).toBeVisible();
  await expect(page.getByText("Command batch is reversible", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "AI plan", exact: true }).click();
  await page.getByRole("button", { name: "Abandon plan", exact: true }).click();
  await expect(page.locator("header code")).toHaveText("rev 0");

  await page.getByRole("button", { name: "Generate plan", exact: true }).click();
  await page.getByRole("button", { name: "Preview changes", exact: true }).click();
  await page.getByRole("button", { name: "AI plan", exact: true }).click();
  await page.getByRole("button", { name: "Apply plan", exact: true }).click();
  await expect(page.locator("header code")).toHaveText("rev 1");
  await expect(projectExplorer.getByText("Revision 1", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "Preview export", exact: true }).click();
  await expect(page.getByText("11 files", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirm write", exact: true }).click();
  await expect(page.getByText("Export verified", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.locator("header code")).toHaveText("rev 1");
  await expect(projectExplorer.getByText("Revision 1", { exact: true })).toBeVisible();
  expect(consoleErrors, serverOutput).toEqual([]);
});

async function reservePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const listener = createServer();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      if (!address || typeof address === "string") {
        listener.close();
        reject(new Error("Could not reserve a local Workbench port."));
        return;
      }
      listener.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function waitForServer(url: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null) {
      throw new Error(`Workbench server exited before becoming ready.\n${serverOutput}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Workbench server did not become ready.\n${serverOutput}`);
}

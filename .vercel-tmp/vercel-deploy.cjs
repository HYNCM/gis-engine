#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
console.error(`Project root: ${projectRoot}`);
console.error("Deploying monorepo to production...");

const result = spawnSync("vercel", ["--yes", "--prod"], {
  cwd: projectRoot,
  encoding: "utf8",
  stdio: ["inherit", "pipe", "pipe"],
  timeout: 600000,
  shell: false,
});

const output = (result.stdout || "") + (result.stderr || "");
console.error(output);

if (result.status !== 0) {
  console.error("Deployment failed with exit code:", result.status);
  process.exit(1);
}

const aliasedMatch = output.match(/Aliased:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
const productionUrl = aliasedMatch ? aliasedMatch[1] : null;
const deploymentMatch = output.match(/Production:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
const deploymentUrl = deploymentMatch ? deploymentMatch[1] : null;
const previewMatch = output.match(/(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/);
const previewUrl = previewMatch ? previewMatch[1] : null;
const finalUrl = productionUrl || deploymentUrl || previewUrl;

if (finalUrl) {
  console.error(`\nDeployment successful! URL: ${finalUrl}`);
  console.log(JSON.stringify({ status: "success", url: finalUrl }));
} else {
  console.log(JSON.stringify({ status: "success", message: "Deployed", raw: output.slice(-500) }));
}

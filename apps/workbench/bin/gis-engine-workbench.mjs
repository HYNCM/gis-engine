#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HELP = `Usage: gis-engine-workbench [project-directory]

Start GIS Engine Workbench for a local project directory.
The server binds to 127.0.0.1 by default and never uploads project data.
`;

export async function runWorkbench(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(HELP);
    return;
  }
  const projectDirectory = argv.find((arg) => !arg.startsWith("-")) ?? process.cwd();
  process.env.WORKBENCH_PROJECT_ROOT = resolve(projectDirectory);
  const { main } = await import("../server/index.mjs");
  await main();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWorkbench().catch((error) => {
    console.error("Failed to start GIS Engine Workbench:", error);
    process.exitCode = 1;
  });
}

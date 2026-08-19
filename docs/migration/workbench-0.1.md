# Workbench 0.1 Local Projects

Workbench is independently versioned at `0.x`. Engine or CLI semver changes do
not change the maturity of the Workbench project format.

## Install And Start

From a source checkout:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build:schema
pnpm workbench:build
pnpm exec gis-engine-workbench ./my-map
```

Open `http://127.0.0.1:4321`. The optional directory argument is the only
project root. Confirmed exports remain beneath that root.

## Upgrade And Reopen

1. Commit or back up `gis-engine.project.json`, `mapspec.json`, `data/`, and
   `.gis-engine/revisions/` before changing Workbench versions.
2. Install the new checkout dependencies and run `pnpm workbench:build`.
3. Start `gis-engine-workbench` with the same project directory.
4. Confirm the displayed revision and history before generating a new plan.
5. Run `pnpm test:workbench:delivery` before relying on a new release for
   delivery work.

Workbench does not rewrite or delete old revisions during open. A revision or
schema mismatch returns a blocking diagnostic rather than reporting success.

## Legacy SQLite Export

Older Studio/Workbench saves may exist in the path selected by
`WORKBENCH_DB_PATH`, the compatibility `STUDIO_DB_PATH`, or the default
`~/.gis-engine/workbench/workbench.sqlite`.

Export those rows without modifying the source database:

```bash
pnpm build:schema
pnpm workbench:build
pnpm workbench:migrate:export -- /path/to/workbench.sqlite ./legacy-workbench-export.json
```

The command opens the SQLite file read-only, writes a new JSON file, refuses to
overwrite an existing destination, and never deletes the source. The JSON is a
review artifact, not an automatically imported canonical project. Inspect its
MapSpec and audit content before manually creating a new project; legacy
records may contain data that must stay local and must not enter telemetry.

## Rollback

Stop the server, restore the backed-up canonical files, and restart against the
same directory. Do not delete `.gis-engine/revisions/`; restore through the
Workbench history action when the project still opens successfully.

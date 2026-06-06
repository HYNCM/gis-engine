# CLI Templates

`create-gis-map` ships four scaffold templates. Select with `-t` / `--template`.

## Usage

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map <project-name> -t <template>
```

## static-html

Standalone HTML with inline CDN imports. No build step.

Files: `index.html`, `README.md`.

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map -t static-html
# open my-map/index.html
```

## vite-ts

Vite + TypeScript project with `@gis-engine/engine` and `@gis-engine/ai`
dependencies.

Files: `package.json`, `tsconfig.json`, `index.html`, `src/main.ts`, `README.md`.

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map -t vite-ts
cd my-map && npm install && npm run dev
```

## mapspec

Minimal MapSpec JSON file only. No application code.

Files: `map.json`, `README.md`.

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map -t mapspec
# load map.json with createMap or validate_spec
```

## app

Interactive Vite + React + Tailwind project with local `map.json` loading,
responsive map controls, and optional generated UI components.

Files: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`,
`map.json`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, and component
files under `src/components/`.

```bash
npm exec --package @gis-engine/cli@latest -- create-gis-map my-map -t app
cd my-map && npm install && npm run build
```

## Template Defaults

All templates generate a spec with `version: "0.1"`, one GeoJSON source
(`points`, empty FeatureCollection), and one circle layer. Provider defaults to
`mock`.

## Common Flags

| Flag | Description |
|---|---|
| `-t` | Template: `static-html`, `vite-ts`, `mapspec`, `app` |
| `-p` | Provider profile ID (default: `mock`) |
| `--dry-run` | Preview without writing |
| `-g` | Run AI generate pipeline instead of scaffold |

See [Provider Configuration](./provider-config.md) for AI provider setup.

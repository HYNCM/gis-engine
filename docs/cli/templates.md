# CLI Templates

`create-gis-map` ships three scaffold templates. Select with `-t` / `--template`.

## Usage

```bash
npx create-gis-map <project-name> -t <template>
```

## static-html

Standalone HTML with inline CDN imports. No build step.

Files: `index.html`, `README.md`.

```bash
npx create-gis-map my-map -t static-html
# open my-map/index.html
```

## vite-ts

Vite + TypeScript project with `@gis-engine/engine` and `@gis-engine/ai`
dependencies.

Files: `package.json`, `tsconfig.json`, `index.html`, `src/main.ts`, `README.md`.

```bash
npx create-gis-map my-map -t vite-ts
cd my-map && npm install && npm run dev
```

## mapspec

Minimal MapSpec JSON file only. No application code.

Files: `map.json`, `README.md`.

```bash
npx create-gis-map my-map -t mapspec
# load map.json with createMap or validate_spec
```

## Template Defaults

All templates generate a spec with `version: "0.2"`, one GeoJSON source
(`points`, empty FeatureCollection), and one circle layer. Provider defaults to
`mock`.

## Common Flags

| Flag | Description |
|---|---|
| `-t` | Template: `static-html`, `vite-ts`, `mapspec` |
| `-p` | Provider profile ID (default: `mock`) |
| `--dry-run` | Preview without writing |
| `-g` | Run AI generate pipeline instead of scaffold |

See [Provider Configuration](./provider-config.md) for AI provider setup.

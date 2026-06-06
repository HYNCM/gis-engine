# Contributing to gis-engine

Thank you for your interest in contributing! This document provides guidelines
and information for contributors.

## Code of Conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code.

## How to Report a Bug

1. Check [existing issues](../../issues) to avoid duplicates.
2. Open a new issue using the **Bug Report** template.
3. Include: a clear description, steps to reproduce, expected vs actual
   behavior, and your environment (Node version, OS, package version).

## How to Suggest a Feature

1. Check [existing issues](../../issues) for similar suggestions.
2. Open a new issue using the **Feature Request** template.
3. Describe the use case, proposed API (if applicable), and alternatives
   considered.

## Development Setup

### Prerequisites

- **Node.js** >= 22
- **pnpm** >= 9.15.0

### Getting Started

```bash
git clone https://github.com/HYNCM/gis-engine.git
cd gis-engine
pnpm install
pnpm build:schema   # generate TypeBox schemas
pnpm build           # compile all packages
pnpm test            # run full test suite
```

### Project Structure

```
gis-engine/
├── packages/
│   ├── engine/     # Core runtime, commands, diagnostics, schema
│   ├── ai/         # MCP tools, AI generation, evidence bundles
│   ├── cli/        # create-gis-map scaffolding + generate pipeline
│   ├── scene3d/    # SceneView3D package boundary (experimental)
│   └── scene3d-three-adapter/  # Three.js adapter (experimental spike)
├── apps/
│   └── studio/     # Studio web application
├── examples/       # Runnable examples and MapSpec fixtures
├── tests/          # Integration and unit tests
└── docs/           # Documentation and VitePress site
```

### Common Commands

| Command | Description |
|---|---|
| `pnpm build` | Build all packages |
| `pnpm build:schema` | Generate TypeBox schemas (run before tests) |
| `pnpm test` | Run full test suite (13 test runners) |
| `pnpm test:studio` | Run studio-specific tests |
| `pnpm check` | Full build + test + studio tests |
| `pnpm lint` | Run Biome linter |
| `pnpm lint:fix` | Run Biome with auto-fix |
| `pnpm format` | Format code with Biome |
| `pnpm knip` | Detect dead code |

## Coding Standards

- **Language**: TypeScript with strict mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **Formatting**: Biome handles formatting — run `pnpm lint:fix` before committing.
- **Imports**: Use `.js` extension in import paths (ESM convention).
- **Exports**: Prefer named exports. Use barrel `index.ts` for public API surface.
- **Tests**: Write tests alongside code changes. All new features need tests.
- **Commits**: Conventional commits preferred (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

## Pull Request Process

1. **Fork** the repository and create a feature branch from `main`.
2. **Make changes** following the coding standards above.
3. **Add tests** for new functionality.
4. **Run checks**: `pnpm check` must pass (build + full test suite).
5. **Submit PR** with a clear description of what changed and why.
6. **CI validation**: All CI checks must pass before merge.
7. **Review**: A maintainer will review your PR. Address feedback promptly.

### PR Checklist

- [ ] `pnpm check` passes locally
- [ ] New tests added for new functionality
- [ ] Documentation updated if public API changed
- [ ] CHANGELOG entry added via `pnpm changeset` (if user-facing change)

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for
version management. If your PR includes user-facing changes, run:

```bash
pnpm changeset
```

Select the affected packages and the appropriate semver bump (patch/minor/major).
This creates a changeset file that will be consumed during the next release.

## Architecture Principles

- **Schema-First**: All map specifications use TypeBox schemas validated by Ajv.
- **Command Pattern**: Map state mutations go through typed commands, never direct mutation.
- **Structured Diagnostics**: Errors return structured `Diagnostic` objects with codes and suggested fixes.
- **IO-Free Validation**: Validation functions must not perform I/O (no network, no filesystem).
- **Adapter Pattern**: Rendering is abstracted through adapters (MockAdapter, MapLibreAdapter).

## Questions?

Open an issue or check the [documentation site](https://hyncm.github.io/gis-engine/) for guides and API reference.

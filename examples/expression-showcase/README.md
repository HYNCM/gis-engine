# Expression Showcase

Demonstrates the **four categories of expression capabilities** added in v1.4.0.

## What it shows

| Category | Expression | Use Case |
|----------|-----------|----------|
| Arithmetic | `["/", ["get", "population"], ["get", "area"]]` | Population density color ramp |
| Fallback | `["coalesce", ["get", "name_en"], ["get", "name"], "Unknown"]` | Missing data graceful fallback |
| Strings | `["concat", ...]`, `["upcase", ...]` | Dynamic label formatting |
| Interpolate | `["interpolate", ["exponential", 1.5], ...]` | Non-linear circle radius scaling |

## Run

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173`).

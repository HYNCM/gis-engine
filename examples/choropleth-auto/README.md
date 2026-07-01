# Choropleth Auto Example

Demonstrates **AI-assisted map generation** using GIS Engine's `planMapGenerationRequest`.

## What it shows

- Natural language intent describing a choropleth visualization
- Planner analyzes the request and produces a structured generation plan
- Population density choropleth with arithmetic expressions (`/` for density calculation)
- Symbol layer with `concat` + `to-string` for dynamic labels
- Theme and data property hints passed through the planner

## Run

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173`).

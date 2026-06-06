import { validateSpec } from "@gis-engine/engine";
import mapSpec from "./map.json" with { type: "json" };

const report = validateSpec(mapSpec);

console.log(JSON.stringify(report, null, 2));

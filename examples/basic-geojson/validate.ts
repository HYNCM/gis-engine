import mapSpec from "./map.json" with { type: "json" };
import { validateSpec } from "@gis-engine/engine";

const report = validateSpec(mapSpec);

console.log(JSON.stringify(report, null, 2));

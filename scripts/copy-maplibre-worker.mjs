// MapLibre 6 finds its worker next to its own module (import.meta.url), which breaks once Next bundles it.
// Serve the worker from /public instead; FanMap points setWorkerUrl at it. Runs before dev and build.
import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url));
const dest = fileURLToPath(new URL("../public/maplibre-gl-worker.mjs", import.meta.url));
mkdirSync(fileURLToPath(new URL("../public/", import.meta.url)), { recursive: true });
copyFileSync(src, dest);

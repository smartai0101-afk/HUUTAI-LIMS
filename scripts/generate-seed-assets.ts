/**
 * Generate valid minimal JPEG placeholders for seed assets.
 * Run: npx tsx scripts/generate-seed-assets.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Valid 1x1 JPEG — browsers and gallery accept .jpg extension. */
const MINI_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Cf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8Qf//Z",
  "base64",
);

const FILES: Array<{ dir: string; name: string }> = [
  { dir: "chemicals", name: "coa-methanol.jpg" },
  { dir: "chemicals", name: "bottle-acetonitrile.jpg" },
  { dir: "chemicals", name: "shelf-acids.jpg" },
  { dir: "chemicals", name: "label-buffer.jpg" },
  { dir: "standards", name: "crm-vial-1.jpg" },
  { dir: "standards", name: "crm-cert.jpg" },
  { dir: "standards", name: "rm-nacl.jpg" },
  { dir: "standards", name: "working-gas.jpg" },
  { dir: "strains", name: "petri-ecoli.jpg" },
  { dir: "strains", name: "glycerol-stock.jpg" },
  { dir: "strains", name: "incubator.jpg" },
  { dir: "strains", name: "strain-label.jpg" },
  { dir: "equipment", name: "hplc-agilent.jpg" },
  { dir: "equipment", name: "uv-vis.jpg" },
  { dir: "equipment", name: "balance.jpg" },
  { dir: "equipment", name: "maintenance.jpg" },
];

const root = join(process.cwd(), "public", "seed-assets");
for (const f of FILES) {
  const dir = join(root, f.dir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, f.name), MINI_JPEG);
}
console.log(`Generated ${FILES.length} seed asset images under public/seed-assets/`);

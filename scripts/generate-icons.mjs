import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "scripts/icon-source.svg";
mkdirSync("public/icons", { recursive: true });

const sizes = [
  { w: 192, out: "public/icons/icon-192.png" },
  { w: 512, out: "public/icons/icon-512.png" },
  { w: 512, out: "public/icons/icon-512-maskable.png" },
  { w: 180, out: "public/icons/apple-touch-icon.png" },
  { w: 32, out: "app/icon.png" },
  { w: 180, out: "app/apple-icon.png" },
];

for (const { w, out } of sizes) {
  await sharp(SRC).resize(w, w).png().toFile(out);
  console.log("generated", out);
}

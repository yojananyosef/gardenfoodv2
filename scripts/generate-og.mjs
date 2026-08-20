import sharp from "sharp";

await sharp("scripts/og-source.svg").resize(1200, 630).png().toFile("public/og.png");
console.log("generated public/og.png");

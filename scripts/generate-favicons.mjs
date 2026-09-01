import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const ROOT = process.cwd();

/** Site lacquer palette (globals.css --lacquer / --lacquer-deep) */
const GRADIENT_START = "#e88976";
const GRADIENT_END = "#d46b58";
const LETTER_COLOR = "#fff8f6";

function buildSvg(size) {
  const radius = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.62);
  const y = Math.round(size * 0.72);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GRADIENT_START}"/>
      <stop offset="100%" stop-color="${GRADIENT_END}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <text
    x="50%"
    y="${y}"
    font-family="Arial Black, Helvetica Neue, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
    fill="${LETTER_COLOR}"
    text-anchor="middle"
  >R</text>
</svg>`;
}

async function renderIcon(size) {
  const svg = Buffer.from(buildSvg(size));
  return sharp(svg).png({ compressionLevel: 9 }).toBuffer();
}

async function main() {
  const sizes = [16, 32, 48, 180];
  const buffers = new Map();

  for (const size of sizes) {
    buffers.set(size, await renderIcon(size));
  }

  const publicDir = join(ROOT, "public");
  const appDir = join(ROOT, "src/app");

  await writeFile(join(publicDir, "favicon-16x16.png"), buffers.get(16));
  await writeFile(join(publicDir, "favicon-32x32.png"), buffers.get(32));
  await writeFile(join(publicDir, "favicon-48x48.png"), buffers.get(48));
  await writeFile(join(publicDir, "apple-touch-icon.png"), buffers.get(180));

  await writeFile(join(appDir, "icon.png"), buffers.get(32));
  await writeFile(join(appDir, "apple-icon.png"), buffers.get(180));

  const icoBuffer = await toIco([
    buffers.get(16),
    buffers.get(32),
    buffers.get(48),
  ]);
  await writeFile(join(appDir, "favicon.ico"), icoBuffer);

  console.log("Generated favicon files:");
  console.log("  public/favicon-16x16.png (16x16)");
  console.log("  public/favicon-32x32.png (32x32)");
  console.log("  public/favicon-48x48.png (48x48)");
  console.log("  public/apple-touch-icon.png (180x180)");
  console.log("  src/app/favicon.ico (16+32+48 multi-size)");
  console.log("  src/app/icon.png, apple-icon.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

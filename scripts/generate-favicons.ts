import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp, { type Sharp } from "sharp";
import toIco from "to-ico";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "public/favicon-source.png");

async function prepareSquareSource() {
  const image = sharp(SOURCE);
  const { width = 0, height = 0 } = await image.metadata();
  const size = Math.min(width, height);

  return image
    .extract({
      left: Math.floor((width - size) / 2),
      top: Math.floor((height - size) / 2),
      width: size,
      height: size,
    })
    .png();
}

async function resizeIcon(
  source: Sharp,
  size: number,
  sharpen: boolean,
): Promise<Buffer> {
  let pipeline = source
    .clone()
    .resize(size, size, {
      fit: "cover",
      kernel: sharp.kernel.lanczos3,
    });

  if (sharpen) {
    pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.5, m2: 0.5 });
  }

  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

async function main() {
  const squareSource = await prepareSquareSource();

  const sizes = [
    { size: 16, sharpen: true },
    { size: 32, sharpen: true },
    { size: 48, sharpen: false },
    { size: 180, sharpen: false },
  ] as const;

  const buffers = new Map<number, Buffer>();
  for (const { size, sharpen } of sizes) {
    buffers.set(size, await resizeIcon(squareSource, size, sharpen));
  }

  const publicDir = join(ROOT, "public");
  const appDir = join(ROOT, "src/app");

  await writeFile(join(publicDir, "favicon-16x16.png"), buffers.get(16)!);
  await writeFile(join(publicDir, "favicon-32x32.png"), buffers.get(32)!);
  await writeFile(join(publicDir, "apple-touch-icon.png"), buffers.get(180)!);

  const icoBuffer = await toIco([
    buffers.get(16)!,
    buffers.get(32)!,
    buffers.get(48)!,
  ]);
  await writeFile(join(appDir, "favicon.ico"), icoBuffer);
  await writeFile(join(publicDir, "favicon.ico"), icoBuffer);

  console.log("Generated favicon files:");
  console.log("  public/favicon-16x16.png (16x16)");
  console.log("  public/favicon-32x32.png (32x32)");
  console.log("  public/apple-touch-icon.png (180x180)");
  console.log("  public/favicon.ico (16+32+48 multi-size)");
  console.log("  src/app/favicon.ico");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { prisma } from "../lib/prisma";
import { UTApi } from "uploadthing/server";
import convert from "heic-convert";

const utapi = new UTApi();

function isHeicUrl(url: string): boolean {
  return /\.(heic|heif)$/i.test(url);
}

function fileKeyFromUrl(url: string): string {
  return url.split("/").pop()!;
}

function toJpegFileName(key: string): string {
  return `${key.replace(/\.(heic|heif)$/i, "")}.jpg`;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { images: { isEmpty: false } },
    select: { id: true, title: true, images: true },
  });

  const affected = products.filter((product) =>
    product.images.some(isHeicUrl),
  );

  console.log(`Found ${affected.length} product(s) with HEIC images`);

  for (const product of affected) {
    const newImages: string[] = [];
    const oldKeys: string[] = [];

    for (const url of product.images) {
      if (!isHeicUrl(url)) {
        newImages.push(url);
        continue;
      }

      console.log(`Converting ${url} (product ${product.id}: "${product.title}")`);

      const response = await fetch(url);
      const inputBuffer = Buffer.from(await response.arrayBuffer());

      const outputBuffer = await convert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 0.8,
      });

      const key = fileKeyFromUrl(url);
      const jpegFile = new File([outputBuffer], toJpegFileName(key), {
        type: "image/jpeg",
      });

      const [uploaded] = await utapi.uploadFiles([jpegFile]);
      if (uploaded.error || !uploaded.data) {
        throw new Error(
          `Failed to upload converted image for ${url}: ${uploaded.error?.message}`,
        );
      }

      console.log(`  -> ${uploaded.data.url}`);

      newImages.push(uploaded.data.url);
      oldKeys.push(key);
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { images: newImages },
    });

    if (oldKeys.length > 0) {
      await utapi.deleteFiles(oldKeys);
    }

    console.log(`Updated product ${product.id}`);
  }

  console.log(`Done. Converted images for ${affected.length} product(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

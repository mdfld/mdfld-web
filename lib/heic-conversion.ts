const HEIC_EXTENSIONS = [".heic", ".heif"];
const HEIC_MIME_TYPES = ["image/heic", "image/heif"];

function isHeicFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  const hasHeicExtension = HEIC_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext),
  );
  const hasHeicMimeType = HEIC_MIME_TYPES.includes(file.type.toLowerCase());

  return hasHeicExtension || hasHeicMimeType;
}

function toJpegFileName(originalName: string): string {
  if (/\.(heic|heif)$/i.test(originalName)) {
    return originalName.replace(/\.(heic|heif)$/i, ".jpg");
  }
  return `${originalName}.jpg`;
}

/**
 * Converts a HEIC/HEIF file to JPEG using heic2any (lazy-loaded WASM).
 * Non-HEIC files are returned unchanged.
 */
export async function convertHeicFile(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  const heic2any = (await import("heic2any")).default;

  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.8,
  });

  const blob = Array.isArray(result) ? result[0] : result;

  return new File([blob], toJpegFileName(file.name), { type: "image/jpeg" });
}

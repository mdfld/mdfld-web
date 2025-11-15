import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  // Only handle local storage mode
  if (process.env.UPLOADTHING_STORAGE !== "local") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { filename } = await params;
    const filepath = path.join(
      process.cwd(),
      process.env.LOCAL_UPLOAD_DIR || "./public/uploads",
      filename,
    );

    // Security: Ensure the resolved path is within the uploads directory
    const uploadsDir = path.resolve(
      process.cwd(),
      process.env.LOCAL_UPLOAD_DIR || "./public/uploads",
    );
    const resolvedPath = path.resolve(filepath);

    if (!resolvedPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Read the file
    const file = await fs.readFile(resolvedPath);

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    // Return the file
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    // Error serving file
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

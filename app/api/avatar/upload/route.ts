import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${randomUUID()}.${file.type.split("/")[1]}`;

    // Save to public/uploads directory
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, new Uint8Array(buffer));

    // Update user avatar in database
    const avatarUrl = `/uploads/${filename}`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: avatarUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      url: avatarUrl,
    });
  } catch (error) {
    // Upload error
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}

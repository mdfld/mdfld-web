import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { resend } from "@/lib/resend";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { reason } = await request.json();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const reporterId = session.user.id;

    if (!reporterId) {
      return NextResponse.json({ error: "Missing reporterId" }, { status: 400 });
    }

    // Increment reportCount and create FraudReport in a transaction
    const [product] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { reportCount: { increment: 1 } },
        select: { id: true, title: true, reportCount: true },
      }),
      prisma.fraudReport.create({
        data: {
          reporterId,
          productId,
          reportType: "OTHER",
          description: reason || "No reason provided",
        },
      }),
    ]);

    // Send notification email (non-blocking)
    resend.emails.send({
      from: "noreply@mdfld.co",
      to: ["ayoola@mdfld.co"],
      subject: `[REPORT] Product flagged: ${product.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:28px;border:1px solid #eaeaea;border-radius:8px;">
          <h2 style="margin:0 0 16px;">Product Flagged</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;font-size:13px;width:120px;">Product ID</td><td style="font-size:13px;">${productId}</td></tr>
            <tr><td style="padding:6px 0;color:#666;font-size:13px;">Product</td><td style="font-size:13px;">${product.title}</td></tr>
            <tr><td style="padding:6px 0;color:#666;font-size:13px;">Reporter</td><td style="font-size:13px;">${reporterId}</td></tr>
            <tr><td style="padding:6px 0;color:#666;font-size:13px;">Total Reports</td><td style="font-size:13px;font-weight:bold;color:#ef4444;">${product.reportCount}</td></tr>
            <tr><td style="padding:6px 0;color:#666;font-size:13px;">Reason</td><td style="font-size:13px;">${reason || "No reason provided"}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:11px;color:#999;">Sent via mdfld.co report system</p>
        </div>
      `,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Report API] Error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

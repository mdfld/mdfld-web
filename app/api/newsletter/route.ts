import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { EMAIL_FONT_FACE, EMAIL_FONT_STACK } from "@/lib/email-font";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !String(email).includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: "noreply@mdfld.co",
      to: ["ayoola@mdfld.co"],
      subject: `New Newsletter Subscriber: ${email}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8">${EMAIL_FONT_FACE}</head>
        <body style="margin:0;padding:0;font-family:${EMAIL_FONT_STACK};background:#f4f4f4;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;border:1px solid #eaeaea;padding:28px;">
            <h2 style="color:#000;font-size:20px;margin:0 0 20px;">New Newsletter Subscriber</h2>
            <p style="font-size:14px;color:#333;margin:0;">
              <strong>${email}</strong> has subscribed to MDFLD updates.
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="color:#999;font-size:11px;margin:0;">Via mdfld.co footer newsletter form</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Newsletter API] Email send error:", error);
      return NextResponse.json(
        { error: "Failed to process subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Newsletter API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

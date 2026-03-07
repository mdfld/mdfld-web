import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message, type } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const subjectLabel = type ?? subject;

    // Send to support inbox
    const { error } = await resend.emails.send({
      from: "Midfield Co <onboarding@resend.dev>",
      to: ["ayoola@mdfld.co"], // test mode: must be account owner's email
      replyTo: email,
      subject: `[CONTACT] ${subjectLabel} — ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;border:1px solid #eaeaea;padding:28px;">
            <h2 style="color:#000;font-size:20px;margin:0 0 20px;">New Contact Message</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:8px 0;color:#666;font-size:13px;width:100px;">Name</td><td style="padding:8px 0;font-size:13px;font-weight:600;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#666;font-size:13px;">Email</td><td style="padding:8px 0;font-size:13px;"><a href="mailto:${email}" style="color:#00d4b6;">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;font-size:13px;">Subject</td><td style="padding:8px 0;font-size:13px;text-transform:capitalize;">${subjectLabel}</td></tr>
            </table>
            <div style="background:#f9f9f9;border-left:3px solid #00d4b6;padding:16px;border-radius:0 4px 4px 0;">
              <p style="margin:0;font-size:13px;line-height:1.7;white-space:pre-wrap;">${message}</p>
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="color:#999;font-size:11px;margin:0;">Sent via mdfld.co contact form</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Contact API] Email send error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    // Auto-reply to sender (non-blocking — don't fail if this fails)
    resend.emails.send({
      from: "Midfield Co <onboarding@resend.dev>",
      to: [email],
      subject: "We've received your message — mdfld",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;border:1px solid #eaeaea;padding:28px;">
            <h2 style="color:#000;font-size:20px;font-weight:normal;margin:0 0 20px;">Thanks, <strong>${name}</strong>.</h2>
            <p style="color:#333;font-size:14px;line-height:1.7;margin:0 0 20px;">
              We've received your message and will get back to you within 24 hours.
            </p>
            <div style="background:#f9f9f9;border:1px solid #eee;padding:16px;border-radius:4px;margin-bottom:20px;">
              <p style="margin:0 0 6px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Your message</p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#333;white-space:pre-wrap;">${message}</p>
            </div>
            <p style="color:#666;font-size:13px;line-height:1.7;margin:0;">— The mdfld Team</p>
          </div>
        </body>
        </html>
      `,
    }).catch(() => {}); // silently ignore auto-reply failures

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
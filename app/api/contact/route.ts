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

    // Send email using Resend
    const { error } = await resend.emails.send({
      from: "MDFLD Contact <contact@mdfld.com>",
      to: ["support@mdfld.com"], // Replace with your actual support email
      replyTo: email,
      subject: `[${type.toUpperCase()}] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="color: #666; font-size: 14px;">
            This email was sent from the MDFLD contact form.
          </p>
        </div>
      `,
    });

    if (error) {
      // Failed to send email
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    // Optional: Send confirmation email to the user
    await resend.emails.send({
      from: "MDFLD <noreply@mdfld.com>",
      to: [email],
      subject: "We've received your message",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for contacting MDFLD</h2>
          
          <p>Hi ${name},</p>
          
          <p>We've received your message and will get back to you within 24-48 hours.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your message:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <p>Best regards,<br>The MDFLD Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="color: #666; font-size: 14px;">
            This is an automated response. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Contact form error
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

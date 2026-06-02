import { username } from "better-auth/plugins/username";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { resend } from "./resend";
import { betterAuth } from "better-auth";
import { randomTemplate } from "./profile-templates";

const LOGO_URL = "https://mdfld.co/mdfld-logo-v2.png";

function emailShell({
  title,
  firstName,
  headline,
  body,
  ctaUrl,
  ctaLabel,
  contextSection,
  footerNote,
}: {
  title: string;
  firstName: string;
  headline: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  contextSection?: string;
  footerNote: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#e8e8e8;">
  <div style="max-width:600px;margin:40px auto;border-radius:8px;overflow:hidden;">

    <div style="background:#0a0a0a;padding:32px 0;text-align:center;border-bottom:2px solid #44cfcf;">
      <img src="${LOGO_URL}" alt="MDFLD" width="140" style="display:block;margin:0 auto;">
    </div>

    <div style="background:#fafafa;padding:44px 48px;">
      <p style="color:#1a1a1a;font-size:14px;margin:0 0 6px;">Hi ${firstName},</p>
      <h1 style="color:#0a0a0a;font-size:22px;font-weight:700;margin:0 0 20px;line-height:1.3;">${headline}</h1>
      <p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 32px;">${body}</p>

      <div style="text-align:center;margin:0 0 36px;">
        <a href="${ctaUrl}" style="background:#44cfcf;color:#0a0a0a;padding:14px 32px;text-decoration:none;border-radius:4px;font-weight:700;font-size:14px;display:inline-block;">${ctaLabel}</a>
      </div>

      <p style="color:#888;font-size:12px;line-height:1.6;margin:0 0 ${contextSection ? "36px" : "0"};">
        Or copy and paste this link into your browser:<br>
        <a href="${ctaUrl}" style="color:#44cfcf;word-break:break-all;">${ctaUrl}</a>
      </p>

      ${contextSection || ""}
    </div>

    <div style="background:#0a0a0a;padding:24px 48px;text-align:center;">
      <p style="color:#555;font-size:12px;margin:0 0 6px;">Built for the beautiful game.</p>
      <p style="color:#444;font-size:11px;margin:0;">${footerNote}</p>
    </div>

  </div>
</body>
</html>`;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      try {
        console.log(`[Auth] Sending password reset email to: ${user.email}`);
        const firstName = user.name?.split(" ")[0] || "there";
        const result = await resend.emails.send({
          from: "Midfield Co <noreply@mdfld.co>",
          to: user.email,
          subject: "Reset your MDFLD password",
          html: emailShell({
            title: "Reset your MDFLD password",
            firstName,
            headline: "Locked out? We've got you.",
            body: "We received a request to reset your password. Click the button below — the link expires in 24 hours.",
            ctaUrl: url,
            ctaLabel: "Reset Password",
            footerNote: "If you didn't request this, your account is safe. No action needed.",
          }),
        });

        if (result.error) {
          console.error(`[Auth] Failed to send password reset email:`, result.error);
          throw new Error(`Failed to send password reset email: ${JSON.stringify(result.error)}`);
        }

        const emailId = "data" in result && result.data ? result.data.id : result.id;
        console.log(`[Auth] Password reset email sent successfully! ID: ${emailId}`);
      } catch (error) {
        console.error(`[Auth] Exception sending password reset email:`, error);
        throw error;
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        console.log(`[Auth] Sending verification email to: ${user.email}`);
        const firstName = user.name?.split(" ")[0] || "there";
        const result = await resend.emails.send({
          from: "Midfield Co <noreply@mdfld.co>",
          to: user.email,
          subject: "Welcome to MDFLD — verify your email",
          html: emailShell({
            title: "Welcome to MDFLD",
            firstName,
            headline: "You're on the pitch.",
            body: "MDFLD is the marketplace built for football. Buy, sell, and authenticate boots, jerseys, and gear — all in one place. Verify your email to get started.",
            ctaUrl: url,
            ctaLabel: "Verify Email",
            contextSection: `
      <div style="border-top:1px solid #e0e0e0;padding-top:28px;">
        <p style="color:#0a0a0a;font-size:13px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.05em;">What you can do on MDFLD</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
              <p style="margin:0;color:#1a1a1a;font-size:13px;font-weight:600;">Browse the marketplace</p>
              <p style="margin:2px 0 0;color:#888;font-size:12px;">Thousands of boots, jerseys, and gear listed daily</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
              <p style="margin:0;color:#1a1a1a;font-size:13px;font-weight:600;">List your gear in minutes</p>
              <p style="margin:2px 0 0;color:#888;font-size:12px;">Sell direct to the football community</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
              <p style="margin:0;color:#1a1a1a;font-size:13px;font-weight:600;">Authenticate before you buy</p>
              <p style="margin:2px 0 0;color:#888;font-size:12px;">Every item verified — no counterfeits, no guesswork</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;">
              <p style="margin:0;color:#1a1a1a;font-size:13px;font-weight:600;">Connect with the community</p>
              <p style="margin:2px 0 0;color:#888;font-size:12px;">Built by football people, for football people</p>
            </td>
          </tr>
        </table>
      </div>`,
            footerNote: "If you didn't create an account, you can safely ignore this email.",
          }),
        });

        if (result.error) {
          console.error(`[Auth] Failed to send verification email:`, result.error);
          throw new Error(`Failed to send verification email: ${JSON.stringify(result.error)}`);
        }

        const emailId = "data" in result && result.data ? result.data.id : result.id;
        console.log(`[Auth] Verification email sent successfully! ID: ${emailId}`);
      } catch (error) {
        console.error(`[Auth] Exception sending verification email:`, error);
        throw error;
      }
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [username()],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const updates: Record<string, unknown> = {};

          if (!("username" in user) || !user.username) {
            const base = ((user.email as string)?.split("@")[0] || "user")
              .replace(/[^a-z0-9]/gi, "")
              .toLowerCase()
              .slice(0, 15);
            const suffix = Math.random().toString(36).slice(2, 8);
            updates.username = `${base}${suffix}`;
            updates.displayUsername = updates.username;
          }

          updates.image = randomTemplate();

          return { data: { ...user, ...updates } };
        },
        // Google OAuth re-applies the provider image after `before`, overriding
        // our template. The `after` hook fires once the row is committed and
        // forces a MDFLD icon whenever the stored image is not one of ours.
        after: async (user) => {
          if (!user.image || !user.image.startsWith("/avatars/")) {
            await prisma.user.update({
              where: { id: user.id },
              data: { image: randomTemplate() },
            });
          }
        },
      },
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }: { user: { name?: string | null; email: string }; newEmail: string; url: string; token: string }) => {
        try {
          console.log(`[Auth] Sending change email confirmation to: ${newEmail}`);
          const firstName = user.name?.split(" ")[0] || "there";
          const result = await resend.emails.send({
            from: "Midfield Co <noreply@mdfld.co>",
            to: newEmail,
            subject: "Confirm your new email — MDFLD",
            html: emailShell({
              title: "Confirm your new email — MDFLD",
              firstName,
              headline: "New details, same game.",
              body: `You requested to change your MDFLD email to <strong>${newEmail}</strong>. Click below to confirm.`,
              ctaUrl: url,
              ctaLabel: "Confirm New Email",
              footerNote: "If this wasn't you, ignore this email. Your current email stays active until confirmed.",
            }),
          });

          if (result.error) {
            console.error(`[Auth] Failed to send change email confirmation:`, result.error);
            throw new Error(`Failed to send change email confirmation: ${JSON.stringify(result.error)}`);
          }

          const emailId = "data" in result && result.data ? result.data.id : result.id;
          console.log(`[Auth] Change email confirmation sent successfully! ID: ${emailId}`);
        } catch (error) {
          console.error(`[Auth] Exception sending change email confirmation:`, error);
          throw error;
        }
      },
    },
    additionalFields: {
      bio: {
        type: "string",
        required: false,
      },
      website: {
        type: "string",
        required: false,
      },
      location: {
        type: "string",
        required: false,
      },
      banner: {
        type: "string",
        required: false,
      },
      trustScore: {
        type: "number",
        defaultValue: 0.0,
        input: false,
      },
      isVerifiedSeller: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        defaultValue: "BUYER",
        input: false,
      },
    },
  },
  logger: {
    disabled: false,
    level: "info",
    log: (_level, _message, ..._args) => {
      // Custom logging implementation - implement proper logging service
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

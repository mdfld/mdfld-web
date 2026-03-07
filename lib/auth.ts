import { username } from "better-auth/plugins/username";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { resend } from "./resend";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }, request) => {
      try {
        console.log(`[Auth] Sending password reset email to: ${user.email}`);
        const result = await resend.emails.send({
          from: "Midfield Co <onboarding@resend.dev>",
          to: user.email,
          subject: "Reset your password",
          html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Reset Your Password - Midfield Co</title>
					</head>
					<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
						<div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 8px; border: 1px solid #eaeaea; padding: 20px;">
							<div style="text-align: center; margin-bottom: 32px;">
								<img src="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/logo.png" alt="Midfield Co Logo" width="40" height="37" style="margin: 0 auto;">
							</div>
							<h1 style="text-align: center; color: #000; font-size: 24px; font-weight: normal; margin: 30px 0;">Reset Your <strong>Password</strong></h1>
							<p style="color: #000; font-size: 14px; line-height: 24px;">Hi ${user.name || user.email},</p>
							<p style="color: #000; font-size: 14px; line-height: 24px;">We received a request to reset your password for your Midfield Co account. Click the button below to create a new password:</p>
							<div style="text-align: center; margin: 32px 0;">
								<a href="${url}" style="background-color: #000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 12px; display: inline-block;">Reset Password</a>
							</div>
							<p style="color: #000; font-size: 14px; line-height: 24px;">
								or copy and paste this URL into your browser: <a href="${url}" style="color: #0066cc; text-decoration: none;">${url}</a>
							</p>
							<hr style="border: none; border-top: 1px solid #eaeaea; margin: 26px 0;">
							<p style="color: #666; font-size: 12px; line-height: 24px;">
								If you did not request a password reset, you can safely ignore this email. This link will expire in 24 hours.
							</p>
						</div>
					</body>
					</html>
				`,
        });

        if (result.error) {
          console.error(`[Auth] Failed to send password reset email:`, result.error);
          throw new Error(`Failed to send password reset email: ${JSON.stringify(result.error)}`);
        }

        const emailId = 'data' in result && result.data ? result.data.id : result.id;
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
        const result = await resend.emails.send({
          from: "Midfield Co <no-reply@mdfld.co>",
          to: user.email,
          subject: "Welcome aboard! | Verify your email address",
          html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Welcome to Midfield Co!</title>
					</head>
					<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
						<div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 8px; border: 1px solid #eaeaea; padding: 20px;">
							<div style="text-align: center; margin-bottom: 32px;">
								<img src="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/logo.png" alt="Midfield Co Logo" width="40" height="37" style="margin: 0 auto;">
							</div>
							<h1 style="text-align: center; color: #000; font-size: 24px; font-weight: normal; margin: 30px 0;">Welcome to <strong>Midfield Co</strong>!</h1>
							<p style="color: #000; font-size: 14px; line-height: 24px;">Hi ${user.name || "there"},</p>
							<p style="color: #000; font-size: 14px; line-height: 24px;">Thank you for joining Midfield Co! Please verify your email address to complete your account setup and start exploring our marketplace.</p>
							<div style="text-align: center; margin: 32px 0;">
								<a href="${url}" style="background-color: #000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 12px; display: inline-block;">Verify Email</a>
							</div>
							<p style="color: #000; font-size: 14px; line-height: 24px;">
								or copy and paste this URL into your browser: <a href="${url}" style="color: #0066cc; text-decoration: none;">${url}</a>
							</p>
							<hr style="border: none; border-top: 1px solid #eaeaea; margin: 26px 0;">
							<p style="color: #666; font-size: 12px; line-height: 24px;">
								If you did not request this email, you can safely ignore it. This link will expire in 24 hours.
							</p>
						</div>
					</body>
					</html>
				`,
        });

        if (result.error) {
          console.error(`[Auth] Failed to send verification email:`, result.error);
          throw new Error(`Failed to send verification email: ${JSON.stringify(result.error)}`);
        }

        const emailId = 'data' in result && result.data ? result.data.id : result.id;
        console.log(`[Auth] Verification email sent successfully! ID: ${emailId}`);
      } catch (error) {
        console.error(`[Auth] Exception sending verification email:`, error);
        throw error;
      }
    },
  },
  socialProviders: {
    // google: {
    // 	clientId: process.env.GOOGLE_CLIENT_ID!,
    // 	clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [username()],
  user: {
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

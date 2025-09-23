import { createAuthClient } from "better-auth/react";
import {
  usernameClient,
  inferAdditionalFields,
  emailOTPClient,
  magicLinkClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    usernameClient(),
    emailOTPClient(),
    magicLinkClient(),
    inferAdditionalFields({
      user: {
        bio: { type: "string", required: false },
        website: { type: "string", required: false },
        location: { type: "string", required: false },
        banner: { type: "string", required: false },
        trustScore: { type: "number", required: false },
        isVerifiedSeller: { type: "boolean", required: false },
        phoneNumber: { type: "string", required: false },
        dateOfBirth: { type: "string", required: false },
        kycStatus: { type: "string", required: false },
      },
    }),
  ],
});

// Export the correct methods
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  resetPassword,
  getSession,
  requestPasswordReset,
  sendVerificationEmail,
  $Infer,
} = authClient;

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

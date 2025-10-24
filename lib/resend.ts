import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export const resend = {
  emails: {
    send: async (options: any) => {
      const client = getResend();
      if (!client) {
        console.error("Resend client not initialized - RESEND_API_KEY missing");
        return { id: "mock-email-id", error: "Email service not configured" };
      }
      return client.emails.send(options);
    },
  },
};

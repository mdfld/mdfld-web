import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    console.log("[Resend] Initializing Resend client...");
    resendInstance = new Resend(process.env.RESEND_API_KEY);
    console.log("[Resend] Client initialized successfully");
  } else if (!process.env.RESEND_API_KEY) {
    console.warn("[Resend] RESEND_API_KEY not found in environment variables");
  }
  return resendInstance;
}

export const resend = {
  emails: {
    send: async (options: any) => {
      const client = getResend();
      if (!client) {
        console.error("[Resend] Cannot send email - client not initialized (RESEND_API_KEY missing)");
        return { id: "mock-email-id", error: "Email service not configured" };
      }

      try {
        console.log(`[Resend] Attempting to send email to: ${options.to}`);
        console.log(`[Resend] Subject: ${options.subject}`);
        console.log(`[Resend] From: ${options.from}`);

        const result = await client.emails.send(options);

        if (result.error) {
          console.error("[Resend] Error sending email:", result.error);
        } else {
          console.log(`[Resend] Email sent successfully! ID: ${result.data?.id}`);
        }

        return result;
      } catch (error) {
        console.error("[Resend] Exception while sending email:", error);
        throw error;
      }
    },
  },
};

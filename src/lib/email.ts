import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Using Resend's shared test sender. To use a custom domain, verify it in
// the Resend dashboard and replace this address (e.g. 'PackMind <hello@yourdomain.com>').
const FROM = "PackMind <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string) {
  console.log("[Email] Sending to:", to, "| subject:", subject);
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[Email] FAILED:", error);
      return { success: false as const, error };
    }
    console.log("[Email] SUCCESS, id:", data?.id);
    return { success: true as const, id: data?.id };
  } catch (err) {
    console.error("[Email] EXCEPTION:", err);
    return { success: false as const, error: err };
  }
}

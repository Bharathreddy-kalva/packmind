import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const WHATSAPP_FROM =
  process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

export async function sendSMS(to: string, body: string) {
  console.log("[SMS] Attempting send to:", to);
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log("[SMS] SUCCESS, SID:", message.sid);
    return { success: true as const, sid: message.sid };
  } catch (error) {
    const err = error as { message?: string; code?: number };
    console.error("[SMS] FAILED:", err.message, "code:", err.code);
    return { success: false as const, error: err.message, code: err.code };
  }
}

export async function sendWhatsApp(to: string, body: string) {
  console.log("[WhatsApp] Attempting send to:", to);
  // ensure the "to" has the whatsapp: prefix exactly once
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  try {
    const message = await client.messages.create({
      body,
      from: WHATSAPP_FROM,
      to: formattedTo,
    });
    console.log("[WhatsApp] SUCCESS, SID:", message.sid);
    return { success: true as const, sid: message.sid };
  } catch (error) {
    const err = error as { message?: string; code?: number };
    if (err.code === 63016) {
      console.error(
        "[WhatsApp] FAILED: outside the 24-hour session window (error 63016). " +
          "The recipient needs to message the sandbox again before a free-form " +
          "message can be sent. Message:",
        err.message
      );
    } else {
      console.error("[WhatsApp] FAILED:", err.message, "code:", err.code);
    }
    return { success: false as const, error: err.message, code: err.code };
  }
}

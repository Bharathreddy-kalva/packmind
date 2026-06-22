import twilio from "twilio";

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

export async function sendSMS(to: string, body: string) {
  console.log("[SMS] Attempting send to:", to);
  try {
    const message = await getClient().messages.create({
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
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  try {
    const message = await getClient().messages.create({
      body,
      from,
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

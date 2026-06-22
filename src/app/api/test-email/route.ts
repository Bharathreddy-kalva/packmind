import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { tripConfirmationEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const { email } = (await request.json()) as { email?: string };

  if (!email) {
    return NextResponse.json(
      { error: "email is required." },
      { status: 400 }
    );
  }

  const { subject, html } = tripConfirmationEmail({
    destination: "Tokyo, Japan",
    departureDate: "2026-07-15",
    returnDate: "2026-07-22",
  });

  const result = await sendEmail(email, subject, html);
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { sendSMS } from "@/lib/twilio";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const { phone } = await request.json();
  const result = await sendSMS(
    phone,
    "PackMind test message — your SMS notifications are working!"
  );
  return NextResponse.json(result);
}

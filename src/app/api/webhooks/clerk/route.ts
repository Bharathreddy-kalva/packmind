import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let event;

  try {
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("Clerk webhook verification failed:", error);
    return new Response("Webhook verification failed", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, phone_numbers, primary_phone_number_id, email_addresses, primary_email_address_id } = event.data;
    const primaryPhone = phone_numbers.find(
      (phone) => phone.id === primary_phone_number_id
    );
    const primaryEmail = email_addresses.find(
      (e) => e.id === primary_email_address_id
    );

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("profiles").insert({
      id,
      phone_number: primaryPhone?.phone_number ?? null,
      email: primaryEmail?.email_address ?? null,
    });

    if (error) {
      console.error("Failed to create Supabase profile:", error);
      return new Response("Failed to create profile", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}

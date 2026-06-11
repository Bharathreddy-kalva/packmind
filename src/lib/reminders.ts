import { createSupabaseServerClient } from "@/lib/supabase";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import type { Reminder, Trip } from "@/types";

type SupabaseClient = ReturnType<typeof createSupabaseServerClient>;

// Process at most this many due reminders per cron run, so a backlog of
// old/overdue reminders never floods the user with messages at once.
const MAX_REMINDERS_PER_RUN = 5;

// WhatsApp sandbox allows ~1 message every 3 seconds — wait between sends.
const SEND_DELAY_MS = 1500;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Filters out empty, too-short, and placeholder numbers (e.g. "0000000000"
 * or "+10000000000") before attempting to send a message.
 */
function isValidPhoneNumber(phone: string | null | undefined): phone is string {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return false;
  if (/^0+$/.test(digits)) return false;

  // Reject placeholder numbers where the national part (after an optional
  // leading country code "1") is all zeros, e.g. "+10000000000".
  const national = digits.replace(/^1/, "");
  if (/^0+$/.test(national)) return false;

  return true;
}

/**
 * Parses a "YYYY-MM-DD" date as local noon, avoiding day-shift bugs where
 * `new Date("YYYY-MM-DD")` parses as UTC midnight and rolls back a day in
 * negative-UTC-offset timezones.
 */
function parseLocalDate(dateString: string): Date {
  return new Date(`${dateString}T12:00:00`);
}

/**
 * Schedules reminders for the 3 days leading up to departure, at 9am, 2pm,
 * and 7pm each day. Messages are generated at send time with live packing %.
 * Reminder slots that are already in the past at creation time are skipped.
 */
export async function scheduleTripReminders(
  supabase: SupabaseClient,
  tripId: string,
  userId: string,
  departureDate: string
) {
  const reminderRows = [];
  const departure = parseLocalDate(departureDate);
  const now = Date.now();

  for (let daysBefore = 3; daysBefore >= 1; daysBefore--) {
    const reminderDate = new Date(departure);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    for (const hour of [9, 14, 19]) {
      const remindAt = new Date(reminderDate);
      remindAt.setHours(hour, 0, 0, 0);

      if (remindAt.getTime() <= now) continue;

      reminderRows.push({
        trip_id: tripId,
        user_id: userId,
        remind_at: remindAt.toISOString(),
        message: "",
        sent: false,
      });
    }
  }

  if (reminderRows.length === 0) return;

  const { error } = await supabase.from("reminders").insert(reminderRows);
  if (error) {
    console.error("[reminders] Failed to schedule reminders:", error);
  }
}

/**
 * Sends the trip-creation confirmation message via WhatsApp. Never throws —
 * failures are logged so they don't block trip creation.
 */
export async function sendTripCreatedSms(
  supabase: SupabaseClient,
  userId: string,
  destination: string,
  departureDate: string,
  returnDate: string
) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone_number")
      .eq("id", userId)
      .single();

    const phoneNumber = profile?.phone_number;
    if (!isValidPhoneNumber(phoneNumber)) return;

    const message = `PackMind: Your trip to ${destination} is created! ${departureDate} to ${returnDate}. We'll send packing reminders starting 3 days before you leave. Reply to this chat anytime to keep reminders active.`;

    await sendWhatsApp(phoneNumber, message);
  } catch (err) {
    console.error("[reminders] Failed to send trip-created WhatsApp message:", err);
  }
}

/**
 * Finds due, unsent reminders and groups them by trip. Since the cron now
 * runs once daily, a trip can have multiple due reminder slots (e.g. the
 * 9am and 2pm slots) by the time the cron fires — rather than sending one
 * message per slot, we send a single, most-relevant message per trip and
 * mark every due slot for that trip as sent. Capped at
 * MAX_REMINDERS_PER_RUN trips per run. Returns the number of trips messaged.
 */
export async function processDueReminders(supabase: SupabaseClient) {
  const now = new Date().toISOString();

  const { data: dueReminders } = await supabase
    .from("reminders")
    .select("*, trips(*)")
    .eq("sent", false)
    .lte("remind_at", now)
    .order("remind_at", { ascending: true })
    .limit(MAX_REMINDERS_PER_RUN * 3);

  const reminderGroups = new Map<
    string,
    (Reminder & { trips: Trip | null })[]
  >();
  for (const reminder of (dueReminders ?? []) as (Reminder & {
    trips: Trip | null;
  })[]) {
    const group = reminderGroups.get(reminder.trip_id) ?? [];
    group.push(reminder);
    reminderGroups.set(reminder.trip_id, group);
  }

  let processed = 0;

  for (const [tripId, group] of reminderGroups) {
    if (processed >= MAX_REMINDERS_PER_RUN) break;

    // The most recently due slot is the most relevant one to report on.
    const primary = group[group.length - 1];
    const trip = primary.trips;

    if (trip) {
      const departure = parseLocalDate(trip.departure_date);
      const daysLeft = Math.ceil((departure.getTime() - Date.now()) / MS_PER_DAY);

      if (daysLeft < 0) {
        console.log(
          `[reminders] Skipping trip ${tripId} — trip to ${trip.destination} already departed.`
        );
      } else {
        const { data: items } = await supabase
          .from("packing_items")
          .select("is_packed")
          .eq("trip_id", tripId);

        const total = items?.length ?? 0;
        const packed = items?.filter((item) => item.is_packed).length ?? 0;
        const pct = total > 0 ? Math.round((packed / total) * 100) : 0;

        const { data: profile } = await supabase
          .from("profiles")
          .select("phone_number")
          .eq("id", primary.user_id)
          .single();

        if (isValidPhoneNumber(profile?.phone_number)) {
          let message: string;
          if (pct === 100) {
            message = `🎉 PackMind: You're 100% packed for ${trip.destination}! ${daysLeft} days to go. Have an amazing trip!`;
          } else if (daysLeft > 1) {
            message = `🧳 PackMind: ${daysLeft} days until ${trip.destination}! You're ${pct}% packed (${packed}/${total} items). ${total - packed} items left!`;
          } else if (daysLeft === 1) {
            message = `🧳 PackMind: Tomorrow's the day for ${trip.destination}! You're ${pct}% packed (${packed}/${total} items). ${total - packed} items left!`;
          } else {
            message = `🧳 PackMind: Today's your departure for ${trip.destination}! You're ${pct}% packed (${packed}/${total} items). ${total - packed} items left!`;
          }

          try {
            const result = await sendWhatsApp(profile.phone_number, message);
            if (result.success) {
              console.log(`[reminders] Sent via WhatsApp for trip ${tripId}`);
              await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
            } else if (result.code === 63016) {
              // Outside the WhatsApp 24h session window — fall back to SMS.
              console.log(
                `[reminders] WhatsApp unavailable (63016) for trip ${tripId} — falling back to SMS`
              );
              const smsResult = await sendSMS(profile.phone_number, message);
              if (smsResult.success) {
                console.log(`[reminders] Sent via SMS fallback for trip ${tripId}`);
              }
              await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
            }
          } catch (err) {
            console.error("[reminders] Failed to send reminder message:", err);
          }
        }
      }
    }

    const idsInGroup = group.map((reminder) => reminder.id);
    await supabase
      .from("reminders")
      .update({ sent: true })
      .in("id", idsInGroup);

    processed += 1;
  }

  const { count: remaining } = await supabase
    .from("reminders")
    .select("*", { count: "exact", head: true })
    .eq("sent", false)
    .lte("remind_at", now);

  console.log(
    `[reminders] Processed ${processed} trip(s). ${remaining ?? 0} due reminder slot(s) remaining.`
  );

  return processed;
}

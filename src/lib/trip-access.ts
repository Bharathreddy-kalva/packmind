import type { createSupabaseServerClient } from "@/lib/supabase";
import type { PackingItem, Trip } from "@/types";

type SupabaseClient = ReturnType<typeof createSupabaseServerClient>;

export type TripAccessRole = "owner" | "companion";

export interface TripWithItems extends Trip {
  packing_items: PackingItem[];
}

export async function getTripAccess(
  supabase: SupabaseClient,
  tripId: string,
  userId: string
): Promise<TripAccessRole | null> {
  const { data: trip } = await supabase
    .from("trips")
    .select("id, user_id")
    .eq("id", tripId)
    .single();

  if (!trip) return null;
  if (trip.user_id === userId) return "owner";

  const { data: collaborator } = await supabase
    .from("trip_collaborators")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();

  return collaborator ? "companion" : null;
}

export async function getTripWithItemsForUser(
  supabase: SupabaseClient,
  tripId: string,
  userId: string
): Promise<{ trip: TripWithItems; accessRole: TripAccessRole } | null> {
  const accessRole = await getTripAccess(supabase, tripId, userId);
  if (!accessRole) return null;

  const { data: trip } = await supabase
    .from("trips")
    .select("*, packing_items(*)")
    .eq("id", tripId)
    .single();

  if (!trip) return null;

  return { trip: trip as TripWithItems, accessRole };
}

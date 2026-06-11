import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { PackingItem, Trip } from "@/types";
import { GeneratePackingList } from "@/components/GeneratePackingList";
import { PackingListClient } from "./packing-list-client";

interface TripWithItems extends Trip {
  packing_items: PackingItem[];
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const supabase = createSupabaseServerClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("*, packing_items(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!trip) {
    notFound();
  }

  const tripData = trip as TripWithItems;
  const items = [...tripData.packing_items].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (items.length === 0 && tripData.status === "planning") {
    return (
      <GeneratePackingList
        tripId={tripData.id}
        destination={tripData.destination}
        departureDate={tripData.departure_date}
        returnDate={tripData.return_date}
      />
    );
  }

  return <PackingListClient trip={tripData} initialItems={items} />;
}

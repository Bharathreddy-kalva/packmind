import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTripWithItemsForUser } from "@/lib/trip-access";
import { GeneratePackingList } from "@/components/GeneratePackingList";
import { PackingListClient } from "./packing-list-client";

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
  const result = await getTripWithItemsForUser(supabase, id, userId);

  if (!result) {
    notFound();
  }

  const { trip: tripData, accessRole } = result;
  const items = [...tripData.packing_items].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (items.length === 0 && tripData.status === "planning" && accessRole === "owner") {
    return (
      <GeneratePackingList
        tripId={tripData.id}
        destination={tripData.destination}
        departureDate={tripData.departure_date}
        returnDate={tripData.return_date}
      />
    );
  }

  return (
    <PackingListClient
      trip={tripData}
      initialItems={items}
      accessRole={accessRole}
    />
  );
}

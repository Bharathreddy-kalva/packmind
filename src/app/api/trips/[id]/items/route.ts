import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTripAccess } from "@/lib/trip-access";

interface PatchItemBody {
  item_id: string;
  is_packed: boolean;
}

interface CreateItemBody {
  name: string;
  category: string;
}

const VALID_CATEGORIES = [
  "clothing",
  "toiletries",
  "electronics",
  "documents",
  "health",
  "misc",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { item_id, is_packed } = (await request.json()) as PatchItemBody;

  if (!item_id || typeof is_packed !== "boolean") {
    return NextResponse.json(
      { error: "item_id and is_packed are required." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const accessRole = await getTripAccess(supabase, id, userId);

  if (!accessRole) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("packing_items")
    .update({ is_packed })
    .eq("id", item_id)
    .eq("trip_id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Item not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ item: data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, category } = (await request.json()) as CreateItemBody;

  if (!name || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "A valid name and category are required." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const accessRole = await getTripAccess(supabase, id, userId);

  if (!accessRole) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("packing_items")
    .insert({
      trip_id: id,
      user_id: userId,
      name,
      category,
      is_packed: false,
      is_used: false,
      ai_suggested: false,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to add item." },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: data }, { status: 201 });
}

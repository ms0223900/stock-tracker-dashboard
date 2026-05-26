import { NextResponse } from "next/server";

import { WATCHLIST_DELETE_ERROR } from "@/lib/constants";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: unknown };
    const id = typeof body.id === "string" ? body.id : "";

    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: WATCHLIST_DELETE_ERROR }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase.from("watchlist").delete().eq("id", id);

    if (error) {
      console.error("watchlist delete failed:", error.message);
      return NextResponse.json({ error: WATCHLIST_DELETE_ERROR }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete-watchlist failed:", error);
    return NextResponse.json({ error: WATCHLIST_DELETE_ERROR }, { status: 500 });
  }
}

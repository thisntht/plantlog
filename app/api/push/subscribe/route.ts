import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role environment variables");
  }

  return createSupabaseClient(url, serviceRoleKey);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await request.json();
  if (!subscription?.endpoint) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  const serviceSupabase = createServiceClient();
  const { error: deleteError } = await serviceSupabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const { error: insertError } = await serviceSupabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    subscription
  });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });

  const serviceSupabase = createServiceClient();
  const { error } = await serviceSupabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

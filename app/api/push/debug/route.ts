import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

async function getAuthenticatedUser(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!url || !anonKey || !token) return null;

  const supabase = createSupabaseClient(url, anonKey);
  const {
    data: { user }
  } = await supabase.auth.getUser(token);

  return user;
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role environment variables");
  }

  return createSupabaseClient(url, serviceRoleKey);
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;

  const env = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    vapidPublicKey: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    vapidPrivateKey: Boolean(process.env.VAPID_PRIVATE_KEY)
  };

  try {
    const serviceSupabase = createServiceClient();
    const { count: userCount, error: countError } = await serviceSupabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (countError) return NextResponse.json({ error: countError.message, env }, { status: 500 });

    let endpointFound = false;
    if (endpoint) {
      const { data, error } = await serviceSupabase.from("push_subscriptions").select("id").eq("endpoint", endpoint).maybeSingle();
      if (error) return NextResponse.json({ error: error.message, env }, { status: 500 });
      endpointFound = Boolean(data);
    }

    return NextResponse.json({
      ok: true,
      env,
      auth: {
        userId: user.id
      },
      subscriptions: {
        userCount: userCount ?? 0,
        endpointFound
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown debug error", env }, { status: 500 });
  }
}

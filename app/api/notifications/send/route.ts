import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

type ProfileRow = {
  id: string;
  notification_time: string | null;
};

type PlantRow = {
  id: string;
  nickname: string;
  watering_interval_days: number;
  started_at: string;
  created_at: string;
};

type LogRow = {
  plant_id: string;
  watered_date: string;
  log_type: string | null;
};

type SnoozeRow = {
  plant_id: string;
  snoozed_until: string;
};

type PushSubscriptionRow = {
  id: string;
  subscription: webpush.PushSubscription;
};

export const dynamic = "force-dynamic";

function getKstParts() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

function addDaysISO(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function getLastWateredDate(plantId: string, logs: LogRow[]) {
  return logs
    .filter((log) => log.plant_id === plantId && (log.log_type ?? "watering") === "watering")
    .map((log) => log.watered_date)
    .sort()
    .at(-1);
}

function getDuePlants(plants: PlantRow[], logs: LogRow[], snoozes: SnoozeRow[], today: string) {
  return plants.filter((plant) => {
    const snooze = snoozes.find((item) => item.plant_id === plant.id);
    if (snooze && snooze.snoozed_until >= today) return false;

    const baseDate = getLastWateredDate(plant.id, logs) ?? plant.started_at ?? plant.created_at.slice(0, 10);
    return addDaysISO(baseDate, plant.watering_interval_days) <= today;
  });
}

async function sendPushNotifications(userId: string, dueCount: number) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return 0;

  const supabase = createClient(url, serviceRoleKey);
  const { data: subscriptions } = await supabase.from("push_subscriptions").select("id, subscription").eq("user_id", userId);
  const rows = (subscriptions ?? []) as PushSubscriptionRow[];

  const payload = JSON.stringify({
    title: "PlantLog",
    body: dueCount > 0 ? `오늘 물줄 식물 ${dueCount}개를 확인해보세요.` : "요즘 식물들은 어떤가요?",
    url: "/"
  });

  let sent = 0;
  for (const row of rows) {
    try {
      await webpush.sendNotification(row.subscription, payload);
      sent += 1;
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? error.statusCode : null;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", row.id);
      }
    }
  }

  return sent;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:hello@plantlog.app";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey || !url || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing notification environment variables" }, { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(url, serviceRoleKey);
  const { date, time } = getKstParts();
  const { data: profiles } = await supabase.from("profiles").select("id, notification_time");
  const targetProfiles = ((profiles ?? []) as ProfileRow[]).filter((profile) => profile.notification_time?.slice(0, 5) === time);

  let sent = 0;
  for (const profile of targetProfiles) {
    const [plantsResult, logsResult, snoozesResult] = await Promise.all([
      supabase.from("plants").select("id, nickname, watering_interval_days, started_at, created_at").eq("user_id", profile.id),
      supabase.from("watering_logs").select("plant_id, watered_date, log_type").eq("user_id", profile.id),
      supabase.from("plant_snoozes").select("plant_id, snoozed_until")
    ]);

    const duePlants = getDuePlants((plantsResult.data ?? []) as PlantRow[], (logsResult.data ?? []) as LogRow[], (snoozesResult.data ?? []) as SnoozeRow[], date);
    if (duePlants.length === 0) continue;

    sent += await sendPushNotifications(profile.id, duePlants.length);
  }

  return NextResponse.json({ ok: true, checked: targetProfiles.length, sent });
}

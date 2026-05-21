"use client";

import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { plants as samplePlants, plantSnoozes as sampleSnoozes, wateringLogs as sampleLogs } from "@/lib/sample-data";
import { createBrowserSupabaseClient, getAppUrl, hasSupabaseConfig } from "@/lib/supabase/browser";
import { mapPlant, mapPlantSnooze, mapWateringLog } from "@/lib/supabase/mappers";
import type { Plant, PlantCondition, PlantSnooze, SoilStatus, WaterAmount, WateringLog } from "@/lib/types";

type NewPlantInput = {
  nickname: string;
  wateringIntervalDays: number;
  scientificName?: string;
  plantType?: string;
  startedAt: string;
  memo?: string;
};

type NewWateringLogInput = {
  plantId: string;
  wateredDate: string;
  soilStatus?: SoilStatus;
  waterAmount?: WaterAmount;
  plantConditions: PlantCondition[];
  memo?: string;
};

type UpdateWateringLogInput = Partial<{
  wateredDate: string;
  soilStatus: SoilStatus;
  waterAmount: WaterAmount;
  plantConditions: PlantCondition[];
  memo: string;
}>;

type PlantDataContextValue = {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  plants: Plant[];
  wateringLogs: WateringLog[];
  plantSnoozes: PlantSnooze[];
  notificationTime: string;
  refresh: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  addPlant: (input: NewPlantInput) => Promise<void>;
  addWateringLog: (input: NewWateringLogInput) => Promise<void>;
  updateWateringLog: (logId: string, input: UpdateWateringLogInput) => Promise<void>;
  deleteWateringLog: (logId: string) => Promise<void>;
  snoozePlant: (plantId: string, days: number) => Promise<void>;
  updateNotificationTime: (time: string) => Promise<void>;
};

const PlantDataContext = createContext<PlantDataContextValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [wateringLogs, setWateringLogs] = useState<WateringLog[]>([]);
  const [plantSnoozes, setPlantSnoozes] = useState<PlantSnooze[]>([]);
  const [notificationTime, setNotificationTime] = useState("20:00");
  const isDemo = !loading && (!hasSupabaseConfig() || !user);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setPlants(samplePlants);
      setWateringLogs(sampleLogs);
      setPlantSnoozes(sampleSnoozes);
      setLoading(false);
      return;
    }

    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();

    setUser(currentUser);

    if (!currentUser) {
      setPlants(samplePlants);
      setWateringLogs(sampleLogs);
      setPlantSnoozes(sampleSnoozes);
      setLoading(false);
      return;
    }

    const [plantsResult, logsResult, snoozesResult, profileResult] = await Promise.all([
      supabase.from("plants").select("*").order("created_at", { ascending: true }),
      supabase
        .from("watering_logs")
        .select("*, watering_log_photos(*)")
        .order("watered_date", { ascending: false }),
      supabase.from("plant_snoozes").select("*"),
      supabase.from("profiles").select("notification_time").eq("id", currentUser.id).maybeSingle()
    ]);

    setPlants(plantsResult.data ? plantsResult.data.map(mapPlant) : []);
    setWateringLogs(logsResult.data ? logsResult.data.map(mapWateringLog) : []);
    setPlantSnoozes(snoozesResult.data ? snoozesResult.data.map(mapPlantSnooze) : []);
    setNotificationTime(profileResult.data?.notification_time?.slice(0, 5) ?? "20:00");
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refresh();
    if (!supabase) return;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh, supabase]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAppUrl("/")
      }
    });
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    await refresh();
  }, [refresh, supabase]);

  const addPlant = useCallback(
    async (input: NewPlantInput) => {
      if (!supabase || !user) return;

      const { error } = await supabase.from("plants").insert({
        user_id: user.id,
        nickname: input.nickname,
        scientific_name: input.scientificName || null,
        plant_type: input.plantType || null,
        watering_interval_days: input.wateringIntervalDays,
        started_at: input.startedAt,
        memo: input.memo || null
      });

      if (error) throw error;
      await refresh();
    },
    [refresh, supabase, user]
  );

  const addWateringLog = useCallback(
    async (input: NewWateringLogInput) => {
      if (!supabase || !user) return;

      const { error } = await supabase.from("watering_logs").insert({
        user_id: user.id,
        plant_id: input.plantId,
        watered_date: input.wateredDate,
        soil_status: input.soilStatus || null,
        water_amount: input.waterAmount || null,
        plant_conditions: input.plantConditions,
        memo: input.memo || null
      });

      if (error) throw error;
      await refresh();
    },
    [refresh, supabase, user]
  );

  const snoozePlant = useCallback(
    async (plantId: string, days: number) => {
      if (!supabase) return;
      const snoozedUntil = new Date();
      snoozedUntil.setDate(snoozedUntil.getDate() + days);

      const { data: existing } = await supabase.from("plant_snoozes").select("id").eq("plant_id", plantId).maybeSingle();
      const payload = {
        plant_id: plantId,
        snoozed_until: snoozedUntil.toISOString().slice(0, 10)
      };
      const { error } = existing
        ? await supabase.from("plant_snoozes").update(payload).eq("id", existing.id)
        : await supabase.from("plant_snoozes").insert(payload);

      if (error) throw error;
      await refresh();
    },
    [refresh, supabase]
  );

  const updateWateringLog = useCallback(
    async (logId: string, input: UpdateWateringLogInput) => {
      if (!supabase || !user) return;

      const payload = {
        watered_date: input.wateredDate,
        soil_status: input.soilStatus ?? null,
        water_amount: input.waterAmount ?? null,
        plant_conditions: input.plantConditions,
        memo: input.memo ?? null
      };

      const { error } = await supabase.from("watering_logs").update(payload).eq("id", logId).eq("user_id", user.id);
      if (error) throw error;
      await refresh();
    },
    [refresh, supabase, user]
  );

  const deleteWateringLog = useCallback(
    async (logId: string) => {
      if (!supabase || !user) return;
      const { error } = await supabase.from("watering_logs").delete().eq("id", logId).eq("user_id", user.id);
      if (error) throw error;
      await refresh();
    },
    [refresh, supabase, user]
  );

  const updateNotificationTime = useCallback(
    async (time: string) => {
      setNotificationTime(time);
      if (!supabase || !user) return;

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: user.email ?? "PlantLog",
        notification_time: time,
        is_public: false
      });

      if (error) throw error;
      await refresh();
    },
    [refresh, supabase, user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isDemo,
      plants,
      wateringLogs,
      plantSnoozes,
      notificationTime,
      refresh,
      signInWithGoogle,
      signOut,
      addPlant,
      addWateringLog,
      updateWateringLog,
      deleteWateringLog,
      snoozePlant,
      updateNotificationTime
    }),
    [
      addPlant,
      addWateringLog,
      deleteWateringLog,
      isDemo,
      loading,
      notificationTime,
      plantSnoozes,
      plants,
      refresh,
      signInWithGoogle,
      signOut,
      snoozePlant,
      updateNotificationTime,
      updateWateringLog,
      user,
      wateringLogs
    ]
  );

  return <PlantDataContext.Provider value={value}>{children}</PlantDataContext.Provider>;
}

export function usePlantData() {
  const context = useContext(PlantDataContext);
  if (!context) throw new Error("usePlantData must be used inside AppProviders");
  return context;
}

"use client";

import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LoginDialog } from "@/components/LoginDialog";
import { plants as samplePlants, plantSnoozes as sampleSnoozes, wateringLogs as sampleLogs } from "@/lib/sample-data";
import { createBrowserSupabaseClient, getAppUrl, hasSupabaseConfig } from "@/lib/supabase/browser";
import { mapPlant, mapPlantSnooze, mapWateringLog } from "@/lib/supabase/mappers";
import type { LogType, Plant, PlantCondition, PlantSnooze, SoilStatus, WaterAmount, WateringLog } from "@/lib/types";

type NewPlantInput = {
  nickname: string;
  wateringIntervalDays: number;
  scientificName?: string;
  plantType?: string;
  startedAt: string;
  memo?: string;
  coverImageUrl?: string;
};

type UpdatePlantInput = Partial<NewPlantInput>;

type NewWateringLogInput = {
  plantId: string;
  wateredDate: string;
  logType: LogType;
  soilStatus?: SoilStatus;
  waterAmount?: WaterAmount;
  plantConditions: PlantCondition[];
  memo?: string;
  photoFiles?: File[];
};

type UpdateWateringLogInput = Partial<{
  wateredDate: string;
  logType: LogType;
  soilStatus: SoilStatus;
  waterAmount: WaterAmount;
  plantConditions: PlantCondition[];
  memo: string;
  photoFiles: File[];
  photoIdsToDelete: string[];
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
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
  addPlant: (input: NewPlantInput) => Promise<Plant | null>;
  updatePlant: (plantId: string, input: UpdatePlantInput) => Promise<void>;
  deletePlant: (plantId: string) => Promise<void>;
  uploadPlantCover: (file: File) => Promise<string>;
  addWateringLog: (input: NewWateringLogInput) => Promise<WateringLog | null>;
  updateWateringLog: (logId: string, input: UpdateWateringLogInput) => Promise<WateringLog | null>;
  deleteWateringLog: (logId: string) => Promise<void>;
  snoozePlant: (plantId: string, days: number) => Promise<void>;
  updateNotificationTime: (time: string) => Promise<void>;
  openLogin: () => void;
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
  const [loginOpen, setLoginOpen] = useState(false);
  const openLogin = useCallback(() => setLoginOpen(true), []);
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
    if (!supabase) throw new Error("Supabase 환경변수가 설정되지 않았어요.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAppUrl("/")
      }
    });
    if (error) throw error;
  }, [supabase]);

  const signInWithKakao = useCallback(async () => {
    if (!supabase) throw new Error("Supabase 환경변수가 설정되지 않았어요.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: getAppUrl("/")
      }
    });
    if (error) throw error;
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    await refresh();
  }, [refresh, supabase]);

  const addPlant = useCallback(
    async (input: NewPlantInput) => {
      if (!supabase || !user) return null;

      const { data, error } = await supabase
        .from("plants")
        .insert({
        user_id: user.id,
        nickname: input.nickname,
        scientific_name: input.scientificName || null,
        plant_type: input.plantType || null,
        watering_interval_days: input.wateringIntervalDays,
        started_at: input.startedAt,
        memo: input.memo || null,
        cover_image_url: input.coverImageUrl || null
        })
        .select("*")
        .single();

      if (error) throw error;
      await refresh();
      return data ? mapPlant(data) : null;
    },
    [refresh, supabase, user]
  );

  const uploadPlantCover = useCallback(
    async (file: File) => {
      if (!supabase || !user) throw new Error("로그인이 필요합니다.");

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/plant-covers/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("plant-photos").upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });

      if (error) throw error;

      const { data } = supabase.storage.from("plant-photos").getPublicUrl(path);
      return data.publicUrl;
    },
    [supabase, user]
  );

  const uploadWateringLogPhotos = useCallback(
    async (logId: string, files: File[]) => {
      if (!supabase || !user || files.length === 0) return;

      const rows: Array<{ watering_log_id: string; image_url: string; storage_path: string }> = [];
      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/watering-logs/${logId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("plant-photos").upload(path, file, {
          cacheControl: "3600",
          upsert: false
        });

        if (error) throw error;
        const { data } = supabase.storage.from("plant-photos").getPublicUrl(path);
        rows.push({
          watering_log_id: logId,
          image_url: data.publicUrl,
          storage_path: path
        });
      }

      const { error } = await supabase.from("watering_log_photos").insert(rows);
      if (error) throw error;
    },
    [supabase, user]
  );

  const deleteWateringLogPhotos = useCallback(
    async (photoIds: string[]) => {
      if (!supabase || photoIds.length === 0) return;

      const { data, error: selectError } = await supabase.from("watering_log_photos").select("id, storage_path").in("id", photoIds);
      if (selectError) throw selectError;

      const paths = (data ?? []).map((photo) => photo.storage_path).filter(Boolean);
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from("plant-photos").remove(paths);
        if (storageError) throw storageError;
      }

      const { error } = await supabase.from("watering_log_photos").delete().in("id", photoIds);
      if (error) throw error;
    },
    [supabase]
  );

  const addWateringLog = useCallback(
    async (input: NewWateringLogInput) => {
      if (!supabase || !user) return null;

      const { data, error } = await supabase
        .from("watering_logs")
        .insert({
          user_id: user.id,
          plant_id: input.plantId,
          watered_date: input.wateredDate,
          log_type: input.logType,
          soil_status: input.soilStatus || null,
          water_amount: input.waterAmount || null,
          plant_conditions: input.plantConditions,
          memo: input.memo || null
        })
        .select("*, watering_log_photos(*)")
        .single();

      if (error) throw error;
      if (!data) return null;

      if (input.photoFiles?.length) {
        await uploadWateringLogPhotos(data.id, input.photoFiles.slice(0, 5));
      }

      const { data: logWithPhotos, error: logError } = await supabase
        .from("watering_logs")
        .select("*, watering_log_photos(*)")
        .eq("id", data.id)
        .single();
      if (logError) throw logError;

      await refresh();
      return logWithPhotos ? mapWateringLog(logWithPhotos) : null;
    },
    [refresh, supabase, uploadWateringLogPhotos, user]
  );

  const updatePlant = useCallback(
    async (plantId: string, input: UpdatePlantInput) => {
      if (!supabase || !user) return;

      const payload: Record<string, string | number | null> = {};
      if ("nickname" in input) payload.nickname = input.nickname ?? null;
      if ("scientificName" in input) payload.scientific_name = input.scientificName || null;
      if ("plantType" in input) payload.plant_type = input.plantType || null;
      if ("wateringIntervalDays" in input) payload.watering_interval_days = input.wateringIntervalDays ?? null;
      if ("startedAt" in input) payload.started_at = input.startedAt ?? null;
      if ("memo" in input) payload.memo = input.memo || null;
      if ("coverImageUrl" in input) payload.cover_image_url = input.coverImageUrl ?? null;

      const { error } = await supabase.from("plants").update(payload).eq("id", plantId).eq("user_id", user.id);
      if (error) throw error;
      await refresh();
    },
    [refresh, supabase, user]
  );

  const deletePlant = useCallback(
    async (plantId: string) => {
      if (!supabase || !user) return;
      const { error } = await supabase.from("plants").delete().eq("id", plantId).eq("user_id", user.id);
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
      if (!supabase || !user) return null;

      const payload = {
        watered_date: input.wateredDate,
        log_type: input.logType,
        soil_status: input.soilStatus ?? null,
        water_amount: input.waterAmount ?? null,
        plant_conditions: input.plantConditions,
        memo: input.memo ?? null
      };

      const { error } = await supabase.from("watering_logs").update(payload).eq("id", logId).eq("user_id", user.id);
      if (error) throw error;
      await deleteWateringLogPhotos(input.photoIdsToDelete ?? []);
      await uploadWateringLogPhotos(logId, (input.photoFiles ?? []).slice(0, 5));
      const { data: logWithPhotos, error: logError } = await supabase
        .from("watering_logs")
        .select("*, watering_log_photos(*)")
        .eq("id", logId)
        .single();
      if (logError) throw logError;

      await refresh();
      return logWithPhotos ? mapWateringLog(logWithPhotos) : null;
    },
    [deleteWateringLogPhotos, refresh, supabase, uploadWateringLogPhotos, user]
  );

  const deleteWateringLog = useCallback(
    async (logId: string) => {
      if (!supabase || !user) return;
      const { data: photos, error: photoError } = await supabase.from("watering_log_photos").select("storage_path").eq("watering_log_id", logId);
      if (photoError) throw photoError;

      const paths = (photos ?? []).map((photo) => photo.storage_path).filter(Boolean);
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from("plant-photos").remove(paths);
        if (storageError) throw storageError;
      }

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
      signInWithKakao,
      signOut,
      addPlant,
      updatePlant,
      deletePlant,
      uploadPlantCover,
      addWateringLog,
      updateWateringLog,
      deleteWateringLog,
      snoozePlant,
      updateNotificationTime,
      openLogin
    }),
    [
      addPlant,
      addWateringLog,
      deletePlant,
      deleteWateringLog,
      isDemo,
      loading,
      notificationTime,
      openLogin,
      plantSnoozes,
      plants,
      refresh,
      signInWithGoogle,
      signInWithKakao,
      signOut,
      snoozePlant,
      updateNotificationTime,
      updatePlant,
      updateWateringLog,
      uploadPlantCover,
      user,
      wateringLogs
    ]
  );

  return (
    <PlantDataContext.Provider value={value}>
      {children}
      {loginOpen ? <LoginDialog onClose={() => setLoginOpen(false)} /> : null}
    </PlantDataContext.Provider>
  );
}

export function usePlantData() {
  const context = useContext(PlantDataContext);
  if (!context) throw new Error("usePlantData must be used inside AppProviders");
  return context;
}

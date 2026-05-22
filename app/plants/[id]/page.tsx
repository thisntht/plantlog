import { AppShell } from "@/components/AppShell";
import { PlantDetail } from "@/components/PlantDetail";
import type { Plant } from "@/lib/types";

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plant: Plant = {
    id,
    userId: "",
    nickname: "식물",
    wateringIntervalDays: 7,
    startedAt: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  };

  return (
    <AppShell>
      <PlantDetail plant={plant} />
    </AppShell>
  );
}

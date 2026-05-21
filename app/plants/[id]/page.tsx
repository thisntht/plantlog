import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PlantDetail } from "@/components/PlantDetail";
import { plants } from "@/lib/sample-data";

export function generateStaticParams() {
  return plants.map((plant) => ({ id: plant.id }));
}

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plant = plants.find((item) => item.id === id);
  if (!plant) notFound();

  return (
    <AppShell>
      <PlantDetail plant={plant} />
    </AppShell>
  );
}

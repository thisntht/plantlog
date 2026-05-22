import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { PlantList } from "@/components/PlantList";

export default function PlantsPage() {
  return (
    <AppShell>
      <PageHeader title="식물" description="식물 정보는 작게, 기록 흐름은 편하게 볼 수 있게 정리했어요." />
      <Suspense fallback={<div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-500">식물 목록을 불러오는 중이에요.</div>}>
        <PlantList />
      </Suspense>
    </AppShell>
  );
}

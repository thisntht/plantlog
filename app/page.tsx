import { AppShell } from "@/components/AppShell";
import { HomeDashboard } from "@/components/HomeDashboard";
import { PageHeader } from "@/components/PageHeader";

export default function HomePage() {
  return (
    <AppShell>
      <PageHeader eyebrow="PlantLog" title="오늘의 식물 기록" description="필요한 만큼만 확인하고, 물을 줬다면 가볍게 남겨보세요." />
      <HomeDashboard />
    </AppShell>
  );
}

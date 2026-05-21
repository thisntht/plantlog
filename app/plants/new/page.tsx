import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { PlantForm } from "@/components/PlantForm";

export default function NewPlantPage() {
  return (
    <AppShell>
      <PageHeader title="식물 등록" description="필수 정보만으로도 바로 시작할 수 있어요." />
      <PlantForm />
    </AppShell>
  );
}

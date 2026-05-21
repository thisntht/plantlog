import { AppShell } from "@/components/AppShell";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { PageHeader } from "@/components/PageHeader";

export default function CalendarPage() {
  return (
    <AppShell>
      <PageHeader title="캘린더" description="기록은 진하게, 예정된 물주기는 조용하게 표시됩니다." />
      <MonthlyCalendar />
    </AppShell>
  );
}

import type { ReactNode } from "react";
import { BottomTabNav } from "@/components/BottomTabNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pt-6 sm:pt-8">
      {children}
      <BottomTabNav />
    </main>
  );
}

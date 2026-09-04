"use client";

import { createContext, useContext } from "react";
import type { ComponentProps, KeyboardEvent } from "react";
import clsx from "clsx";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ value, onValueChange, className, ...props }: ComponentProps<"div"> & TabsContextValue) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className} {...props} />
    </TabsContext.Provider>
  );
}

export function TabsList({ className, onKeyDown, ...props }: ComponentProps<"div">) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (currentIndex < 0 || tabs.length === 0) return;

    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  };

  return (
    <div
      role="tablist"
      className={clsx("inline-flex h-10 items-center rounded-md bg-neutral-100 p-1 text-neutral-500", className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className, onClick, ...props }: ComponentProps<"button"> & { value: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger는 Tabs 안에서 사용해야 합니다.");

  const active = context.value === value;
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      tabIndex={active ? 0 : -1}
      className={clsx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active ? "bg-white text-neutral-950 shadow-sm" : "hover:text-neutral-900",
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.onValueChange(value);
      }}
      {...props}
    />
  );
}

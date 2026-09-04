import type { ComponentProps } from "react";
import clsx from "clsx";

type BadgeVariant = "default" | "outline";

export function badgeVariants({ variant = "default", className }: { variant?: BadgeVariant; className?: string } = {}) {
  return clsx(
    "inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
    variant === "default"
      ? "border-transparent bg-neutral-950 text-white"
      : "border-neutral-200 bg-transparent text-neutral-950",
    className
  );
}

export function Badge({ className, variant = "default", ...props }: ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return <span className={badgeVariants({ variant, className })} {...props} />;
}

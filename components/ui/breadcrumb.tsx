import type { ComponentProps } from "react";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";

export function Breadcrumb({ className, ...props }: ComponentProps<"nav">) {
  return <nav aria-label="경로" className={className} {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      className={clsx("flex flex-wrap items-center gap-1.5 text-sm text-neutral-500", className)}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={clsx("inline-flex items-center gap-1.5", className)} {...props} />;
}

export function BreadcrumbButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={clsx("rounded-sm font-medium transition-colors hover:text-neutral-900", className)}
      type="button"
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ className, ...props }: ComponentProps<"li">) {
  return (
    <li aria-hidden="true" className={clsx("text-neutral-300 [&>svg]:h-3.5 [&>svg]:w-3.5", className)} {...props}>
      <ChevronRight />
    </li>
  );
}

export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return <span aria-current="page" className={clsx("font-medium text-neutral-900", className)} {...props} />;
}

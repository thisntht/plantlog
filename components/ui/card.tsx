import type { ComponentProps } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("rounded-xl border border-neutral-200 bg-white text-neutral-950 shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("flex items-center p-6 pt-0", className)} {...props} />;
}

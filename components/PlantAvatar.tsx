import { Sprout } from "lucide-react";

export function PlantAvatar({ name, imageUrl, size = "md" }: { name: string; imageUrl?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-24 w-24"
  }[size];

  if (imageUrl) {
    return <img alt={`${name} 대표 사진`} className={`${sizeClass} rounded-lg object-cover`} src={imageUrl} />;
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700`}>
      <Sprout aria-hidden className={size === "lg" ? "h-10 w-10" : "h-5 w-5"} />
    </div>
  );
}

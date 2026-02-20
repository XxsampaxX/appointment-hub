import { CalendarDays } from "lucide-react";

interface AgendyaLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function AgendyaLogo({ size = "md" }: AgendyaLogoProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex items-center gap-1.5">
      <CalendarDays className={`${iconSize} text-primary`} />
      <span className={`font-bold ${textSize} tracking-wide text-foreground`}>
        AGEND<span className="text-primary">YA</span>
      </span>
    </div>
  );
}

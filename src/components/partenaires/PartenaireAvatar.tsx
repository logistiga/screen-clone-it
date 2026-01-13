import { cn } from "@/lib/utils";

interface PartenaireAvatarProps {
  nom: string;
  prenom?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const colorPalette = [
  "bg-primary/90 text-primary-foreground",
  "bg-emerald-500 text-white",
  "bg-blue-500 text-white",
  "bg-purple-500 text-white",
  "bg-orange-500 text-white",
  "bg-pink-500 text-white",
  "bg-cyan-500 text-white",
  "bg-indigo-500 text-white",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

function getInitials(nom: string, prenom?: string): string {
  const firstInitial = nom?.charAt(0)?.toUpperCase() || "";
  const secondInitial = prenom?.charAt(0)?.toUpperCase() || nom?.charAt(1)?.toUpperCase() || "";
  return `${firstInitial}${secondInitial}`;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function PartenaireAvatar({ nom, prenom, size = "md", className }: PartenaireAvatarProps) {
  const initials = getInitials(nom, prenom);
  const colorClass = getColorFromName(nom + (prenom || ""));

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold shadow-sm",
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}

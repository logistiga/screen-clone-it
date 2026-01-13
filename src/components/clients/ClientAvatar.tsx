import { cn } from "@/lib/utils";

interface ClientAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Generate a consistent color from a string
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good saturation and lightness for visibility
  const h = Math.abs(hash) % 360;
  const s = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
  const l = 45 + (Math.abs(hash >> 16) % 15); // 45-60%
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl font-bold",
};

export function ClientAvatar({ name, size = "md", className }: ClientAvatarProps) {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);
  
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-medium shadow-sm transition-transform duration-200 hover:scale-105",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}

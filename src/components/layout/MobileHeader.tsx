import { useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import logo from "@/assets/logistiga-logo-new.png";

interface MobileHeaderProps {
  title: string;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  return (
    <header className="flex flex-col bg-sidebar text-sidebar-foreground safe-area-top">
      <div className="flex h-14 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logistiga" className="h-8 w-auto" />
          <h1 className="text-base font-semibold text-sidebar-foreground truncate max-w-[180px]">{title}</h1>
        </div>

        <div className="flex items-center gap-1">
          <GlobalSearch />
          <NotificationCenter />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, KeyRound, Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-users";

interface AppHeaderProps {
  title: string;
}

export const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(
  function AppHeader({ title }, ref) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
    navigate("/login", { replace: true });
  };

  const getUserInitials = () => {
    if (!user?.nom) return "U";
    return user.nom.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header ref={ref} className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Global Search */}
        <GlobalSearch />
        
        {/* Notifications */}
        <NotificationCenter />
        
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={user?.nom || "Utilisateur"} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium">{user?.nom || "Utilisateur"}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || "Invité"}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profil")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Mon profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/profil?tab=security")} className="cursor-pointer">
              <KeyRound className="mr-2 h-4 w-4" />
              <span>Changer le mot de passe</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/parametres")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});

AppHeader.displayName = "AppHeader";

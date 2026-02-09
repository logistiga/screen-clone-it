import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, Receipt, Wallet, Menu,
  FileText, ClipboardList, BarChart3, Settings, 
  TrendingUp, CreditCard, Building2, PiggyBank,
  Percent, UserCog, Shield, History, Mail, Hash,
  Handshake, Tag, BookOpen, ShieldAlert, XCircle,
  FileStack, X, ChevronRight, LogOut, User, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { canAccessRoute } from "@/config/routePermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-users";
import { useToast } from "@/hooks/use-toast";

const bottomNavItems = [
  { title: "Accueil", url: "/", icon: LayoutDashboard },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Factures", url: "/factures", icon: Receipt },
  { title: "Caisse", url: "/caisse", icon: Wallet },
  { title: "Menu", url: "#menu", icon: Menu },
];

const fullMenuSections = [
  {
    label: "Commercial",
    items: [
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Partenaires", url: "/partenaires", icon: Handshake },
      { title: "Devis", url: "/devis", icon: FileText },
      { title: "Ordres de travail", url: "/ordres", icon: ClipboardList },
      { title: "Factures", url: "/factures", icon: Receipt },
      { title: "Notes de début", url: "/notes-debut", icon: FileStack },
      { title: "Annulations", url: "/annulations", icon: XCircle },
    ]
  },
  {
    label: "Comptabilité",
    items: [
      { title: "Caisse", url: "/caisse", icon: Wallet },
      { title: "Banque", url: "/banque", icon: Building2 },
      { title: "Caisse Globale", url: "/caisse-globale", icon: PiggyBank },
      { title: "Primes à décaisser", url: "/primes-decaissement", icon: Wallet },
      { title: "Taxes", url: "/taxes", icon: Percent },
      { title: "Factures exonérées", url: "/factures-exonerees", icon: Percent },
    ]
  },
  {
    label: "Finance",
    items: [
      { title: "Reporting", url: "/reporting", icon: BarChart3 },
      { title: "Prévisions", url: "/previsions", icon: TrendingUp },
      { title: "Crédits Bancaires", url: "/credits", icon: CreditCard },
    ]
  },
  {
    label: "Paramétrage",
    items: [
      { title: "Utilisateurs", url: "/utilisateurs", icon: UserCog },
      { title: "Rôles", url: "/roles", icon: Shield },
      { title: "Traçabilité", url: "/tracabilite", icon: History },
      { title: "Emails", url: "/emails", icon: Mail },
      { title: "Banques", url: "/banques", icon: Building2 },
      { title: "Catégories dépenses", url: "/categories-depenses", icon: Tag },
      { title: "Numérotation", url: "/numerotation", icon: Hash },
      { title: "Guide", url: "/guide", icon: BookOpen },
    ]
  },
  {
    label: "Sécurité",
    adminOnly: true,
    items: [
      { title: "Connexions suspectes", url: "/securite/connexions-suspectes", icon: ShieldAlert },
    ]
  }
];

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission, hasRole, logout } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isAdmin = hasRole('admin') || hasRole('administrateur') || hasRole('directeur');

  if (!isMobile || !user) return null;

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  const handleNavClick = (url: string) => {
    if (url === "#menu") {
      setMenuOpen(true);
      return;
    }
    navigate(url);
  };

  const handleMenuItemClick = (url: string) => {
    setMenuOpen(false);
    navigate(url);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
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
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {bottomNavItems.map((item) => {
            const active = item.url === "#menu" ? menuOpen : isActive(item.url);
            return (
              <button
                key={item.title}
                onClick={() => handleNavClick(item.url)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative",
                  active 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                {active && item.url !== "#menu" && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
                <item.icon className={cn("h-5 w-5", active && "scale-110")} />
                <span className="text-[10px] font-medium leading-tight">{item.title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Full Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={user?.nom || "Utilisateur"} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-base text-left">{user?.nom || "Utilisateur"}</SheetTitle>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role || "Invité"}</p>
                </div>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 h-[calc(85vh-140px)]">
            <div className="px-4 py-3 space-y-4">
              {/* Quick user actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleMenuItemClick("/profil")}
                  className="flex-1 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4 text-primary" />
                  <span>Mon profil</span>
                </button>
                <button
                  onClick={() => handleMenuItemClick("/guide")}
                  className="flex-1 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm hover:bg-muted transition-colors"
                >
                  <Download className="h-4 w-4 text-primary" />
                  <span>Installer</span>
                </button>
              </div>

              {/* Menu sections */}
              {fullMenuSections.map((section) => {
                if (section.adminOnly && !isAdmin) return null;
                
                const visibleItems = section.items.filter(item =>
                  canAccessRoute(item.url, hasPermission, hasRole, isAdmin)
                );
                
                if (visibleItems.length === 0) return null;

                return (
                  <div key={section.label}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      {section.label}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {visibleItems.map((item) => {
                        const active = isActive(item.url);
                        return (
                          <button
                            key={item.url}
                            onClick={() => handleMenuItemClick(item.url)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all",
                              active 
                                ? "bg-primary/10 text-primary border border-primary/20" 
                                : "bg-muted/30 text-foreground hover:bg-muted/60"
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[11px] font-medium leading-tight line-clamp-2">
                              {item.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Logout button at bottom */}
          <div className="border-t px-4 py-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full rounded-lg p-3 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

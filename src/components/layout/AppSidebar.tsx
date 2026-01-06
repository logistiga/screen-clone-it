import { 
  Users, FileText, ClipboardList, Receipt, XCircle,
  Wallet, Building2, PiggyBank, BarChart3, TrendingUp, CreditCard,
  Settings, UserCog, Shield, History, Mail, Percent, Building, Hash,
  FileStack, Handshake
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import logo from "@/assets/lojistiga-logo.png";

const menuItems = {
  commercial: {
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
  comptabilite: {
    label: "Comptabilité",
    items: [
      { title: "Caisse", url: "/caisse", icon: Wallet },
      { title: "Banque", url: "/banque", icon: Building2 },
      { title: "Caisse Globale", url: "/caisse-globale", icon: PiggyBank },
    ]
  },
  finance: {
    label: "Finance",
    items: [
      { title: "Reporting", url: "/reporting", icon: BarChart3 },
      { title: "Prévisions", url: "/previsions", icon: TrendingUp },
      { title: "Crédits Bancaires", url: "/credits", icon: CreditCard },
    ]
  },
  parametrage: {
    label: "Paramétrage",
    items: [
      { title: "Utilisateurs", url: "/utilisateurs", icon: UserCog },
      { title: "Rôles", url: "/roles", icon: Shield },
      { title: "Traçabilité", url: "/tracabilite", icon: History },
      { title: "Emails", url: "/emails", icon: Mail },
      { title: "Taxes", url: "/taxes", icon: Percent },
      { title: "Banques", url: "/banques", icon: Building },
      { title: "Numérotation", url: "/numerotation", icon: Hash },
    ]
  }
};

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="border-r-0">
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        <img src={logo} alt="Lojistiga" className="h-10 w-auto" />
      </div>
      
      <SidebarContent className="px-2 py-4">
        {Object.entries(menuItems).map(([key, group]) => (
          <SidebarGroup key={key}>
            <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url || 
                    (item.url !== "/" && location.pathname.startsWith(item.url));
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                            isActive 
                              ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

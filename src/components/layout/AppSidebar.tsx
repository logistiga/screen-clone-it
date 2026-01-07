import { useState } from "react";
import { 
  Users, FileText, ClipboardList, Receipt, XCircle,
  Wallet, Building2, PiggyBank, BarChart3, TrendingUp, CreditCard,
  Settings, UserCog, Shield, History, Mail, Percent, Building, Hash,
  FileStack, Handshake, LayoutDashboard, ChevronDown
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import logo from "@/assets/lojistiga-logo.png";

const menuItems = {
  dashboard: {
    label: "",
    collapsible: false,
    items: [
      { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
    ]
  },
  commercial: {
    label: "Commercial",
    collapsible: true,
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
    collapsible: true,
    items: [
      { title: "Caisse", url: "/caisse", icon: Wallet },
      { title: "Banque", url: "/banque", icon: Building2 },
      { title: "Caisse Globale", url: "/caisse-globale", icon: PiggyBank },
    ]
  },
  finance: {
    label: "Finance",
    collapsible: true,
    items: [
      { title: "Reporting", url: "/reporting", icon: BarChart3 },
      { title: "Prévisions", url: "/previsions", icon: TrendingUp },
      { title: "Crédits Bancaires", url: "/credits", icon: CreditCard },
    ]
  },
  parametrage: {
    label: "Paramétrage",
    collapsible: true,
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    commercial: true,
    comptabilite: true,
    finance: true,
    parametrage: true,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Sidebar className="border-r-0">
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        <img src={logo} alt="Lojistiga" className="h-10 w-auto" />
      </div>
      
      <SidebarContent className="px-2 py-4">
        {Object.entries(menuItems).map(([key, group]) => {
          if (!group.collapsible) {
            return (
              <SidebarGroup key={key}>
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
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 relative",
                                isActive 
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-white" 
                                  : "text-sidebar-foreground hover:bg-white/20 hover:text-white hover:translate-x-1 hover:shadow-md"
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
            );
          }

          return (
            <Collapsible
              key={key}
              open={openGroups[key]}
              onOpenChange={() => toggleGroup(key)}
            >
              <SidebarGroup>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="flex items-center justify-between text-sidebar-foreground/60 text-xs uppercase tracking-wider cursor-pointer hover:text-sidebar-foreground transition-colors">
                    <span>{group.label}</span>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        openGroups[key] ? "rotate-0" : "-rotate-90"
                      )} 
                    />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
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
                                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 relative",
                                  isActive 
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-white" 
                                    : "text-sidebar-foreground hover:bg-white/20 hover:text-white hover:translate-x-1 hover:shadow-md"
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
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}

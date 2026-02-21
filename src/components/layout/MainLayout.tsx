import { ReactNode, forwardRef } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { PageTransition } from "./PageTransition";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAutoSync } from "@/hooks/use-auto-sync";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export const MainLayout = forwardRef<HTMLDivElement, MainLayoutProps>(
  function MainLayout({ children, title }, ref) {
    const isMobile = useIsMobile();
    useAutoSync();

    // Mobile layout: no sidebar, bottom nav
    if (isMobile) {
      return (
        <div ref={ref} className="flex min-h-screen w-full flex-col">
          <MobileHeader title={title} />
          <main className="flex-1 overflow-auto bg-muted/30 p-3 pb-20">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <MobileBottomNav />
        </div>
      );
    }

    // Desktop layout: sidebar + header
    return (
      <SidebarProvider>
        <div ref={ref} className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col">
            <AppHeader title={title} />
            <main className="flex-1 overflow-auto bg-muted/30 p-4 lg:p-6">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }
);

MainLayout.displayName = "MainLayout";

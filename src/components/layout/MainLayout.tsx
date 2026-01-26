import { ReactNode, forwardRef } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { PageTransition } from "./PageTransition";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export const MainLayout = forwardRef<HTMLDivElement, MainLayoutProps>(
  function MainLayout({ children, title }, ref) {
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

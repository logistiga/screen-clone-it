import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { PageTransition } from "./PageTransition";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}

export function MainLayout({ children, title, actions }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader title={title} actions={actions} />
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

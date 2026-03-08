import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-background sticky top-0 z-40">
            <SidebarTrigger className="ml-3" />
          </header>
          <main className="flex-1 p-4 sm:p-6 animate-fade-in overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

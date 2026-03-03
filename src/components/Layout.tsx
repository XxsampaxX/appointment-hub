import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { LayoutDashboard, Users, Layers, CalendarDays, LogOut, UserCircle, Clock, MessageSquare, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgendyaLogo from "@/components/AgendyaLogo";


export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuthContext();
  const { company } = useCompanyContext();
  const location = useLocation();

  const slug = company?.slug || "";

  const navItems = [
    { to: `/${slug}/admin`, label: "Dashboard", icon: LayoutDashboard },
    { to: `/${slug}/profissionais`, label: "Profissionais", icon: UserCircle },
    { to: `/${slug}/servicos`, label: "Serviços", icon: Layers },
    { to: `/${slug}/clientes`, label: "Clientes", icon: Users },
    { to: `/${slug}/agenda`, label: "Agenda", icon: CalendarDays },
    { to: `/${slug}/horarios`, label: "Horários", icon: Clock },
    { to: `/${slug}/atendimento`, label: "Chat", icon: MessageSquare },
    { to: `/${slug}/whatsapp`, label: "WhatsApp", icon: Smartphone },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Link to="/">
              <AgendyaLogo size="md" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button variant={isActive ? "default" : "ghost"} size="sm" className="gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {currentUser?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        <nav className="md:hidden flex border-t border-border overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 min-w-[60px] flex flex-col items-center gap-0.5 py-2 text-[10px] sm:text-xs font-medium transition-colors ${
                  isActive ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="truncate w-full text-center px-0.5">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 container px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
        {children}
      </main>
    </div>
  );
}

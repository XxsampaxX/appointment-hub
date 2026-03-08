import { useLocation, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCompanyContext } from "@/contexts/CompanyContext";
import {
  LayoutDashboard, CalendarDays, Users, Scissors, DollarSign,
  UserCog, Building2, Settings, UserCircle, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import AgendyaLogo from "@/components/AgendyaLogo";
import type { AppRole } from "@/types";

interface MenuItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: AppRole[]; // which roles can see this
}

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { logout, currentUser } = useAuthContext();
  const { company, companyRole } = useCompanyContext();
  const location = useLocation();
  const slug = company?.slug || "";

  const allRoles: AppRole[] = ["admin", "profissional", "recepcionista", "user"];

  const menuItems: MenuItem[] = [
    { to: `/${slug}/admin`, label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
    { to: `/${slug}/agenda`, label: "Agenda", icon: CalendarDays, roles: ["admin", "profissional", "recepcionista"] },
    { to: `/${slug}/clientes`, label: "Clientes", icon: Users, roles: ["admin", "recepcionista"] },
    { to: `/${slug}/procedimentos`, label: "Procedimentos", icon: Scissors, roles: ["admin"] },
    { to: `/${slug}/financeiro`, label: "Financeiro", icon: DollarSign, roles: ["admin"] },
    { to: `/${slug}/usuarios`, label: "Usuários", icon: UserCog, roles: ["admin"] },
    { to: `/${slug}/estabelecimentos`, label: "Estabelecimentos", icon: Building2, roles: ["admin"] },
    { to: `/${slug}/configuracoes`, label: "Configurações", icon: Settings, roles: ["admin"] },
    { to: `/${slug}/meu-perfil`, label: "Meu Perfil", icon: UserCircle, roles: allRoles },
  ];

  const visibleItems = menuItems.filter((item) =>
    companyRole ? item.roles.includes(companyRole) : false
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <Link to="/">
            {collapsed ? (
              <img src="/favicon.png" alt="Agendya" className="h-8 w-8" />
            ) : (
              <AgendyaLogo size="md" />
            )}
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                  >
                    <NavLink
                      to={item.to}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && currentUser && (
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60 truncate">
            {currentUser.name}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Sair"
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

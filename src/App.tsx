import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { CompanyProvider, useCompanyContext } from "@/contexts/CompanyContext";
import CompanySlugWrapper from "@/components/CompanySlugWrapper";
import CompanyLoginPage from "./pages/CompanyLoginPage";
import CompanyRegisterPage from "./pages/CompanyRegisterPage";
import Dashboard from "./pages/Dashboard";
import ServicesPage from "./pages/ServicesPage";
import ClientsPage from "./pages/ClientsPage";
import AgendaPage from "./pages/AgendaPage";
import ScheduleSettingsPage from "./pages/ScheduleSettingsPage";
import ProfessionalsPage from "./pages/ProfessionalsPage";
import UserBookingPage from "./pages/UserBookingPage";
import PublicBookingPage from "./pages/PublicBookingPage";
import NotFound from "./pages/NotFound";
import CompanySelectPage from "./pages/CompanySelectPage";
import HomePage from "./pages/HomePage";
import GlobalLoginPage from "./pages/GlobalLoginPage";
import MasterAdminPage from "./pages/MasterAdminPage";
import CreateCompanyPage from "./pages/CreateCompanyPage";
import RegisterCompanyPage from "./pages/RegisterCompanyPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PlansPage from "./pages/PlansPage";
import MetaOAuthCallbackPage from "./pages/MetaOAuthCallbackPage";
import WhatsAppSettingsPage from "./pages/WhatsAppSettingsPage";
import WhatsAppChatPage from "./pages/WhatsAppChatPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import UsuariosPage from "./pages/UsuariosPage";
import EstabelecimentosPage from "./pages/EstabelecimentosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import MeuPerfilPage from "./pages/MeuPerfilPage";
import ProcedimentosPage from "./pages/ProcedimentosPage";
import { useMasterAdmin } from "@/hooks/useMasterAdmin";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();
  const { companyRole, loading: companyLoading, company } = useCompanyContext();
  if (loading || companyLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to={`/${company?.slug || ""}`} replace />;
  if (companyRole !== "admin") return <Navigate to={`/${company?.slug}/meus-agendamentos`} replace />;
  return <>{children}</>;
}

function StaffRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();
  const { companyRole, loading: companyLoading, company } = useCompanyContext();
  if (loading || companyLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to={`/${company?.slug || ""}`} replace />;
  if (companyRole === null) return <LoadingScreen />;
  if (companyRole === "user") return <Navigate to={`/${company?.slug}/meus-agendamentos`} replace />;
  return <>{children}</>;
}

function AgendaRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();
  const { companyRole, loading: companyLoading, company } = useCompanyContext();
  if (loading || companyLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to={`/${company?.slug || ""}`} replace />;
  if (companyRole === null) return <LoadingScreen />;
  // admin, profissional, recepcionista can access agenda
  if (companyRole === "user") return <Navigate to={`/${company?.slug}/meus-agendamentos`} replace />;
  return <>{children}</>;
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();
  const { company } = useCompanyContext();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to={`/${company?.slug || ""}`} replace />;
  return <>{children}</>;
}

function MasterRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();
  const { isMasterAdmin, loading: masterLoading } = useMasterAdmin();
  if (loading || masterLoading) return <LoadingScreen />;
  if (!isAuthenticated || !isMasterAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/empresas" element={<CompanySelectPage />} />
              <Route path="/login" element={<GlobalLoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/cadastrar-empresa" element={<RegisterCompanyPage />} />
              <Route path="/onboarding/business-type" element={<RegisterCompanyPage />} />
              <Route path="/planos" element={<PlansPage />} />
              <Route path="/oauth/meta/callback" element={<MetaOAuthCallbackPage />} />
              <Route path="/admin-master" element={<MasterRoute><MasterAdminPage /></MasterRoute>} />
              <Route path="/admin-master/nova-empresa" element={<MasterRoute><CreateCompanyPage /></MasterRoute>} />

              {/* All company routes under /:slug */}
              <Route path="/:slug" element={<CompanySlugWrapper />}>
                <Route index element={<CompanyLoginPage />} />
                <Route path="login" element={<CompanyLoginPage />} />
                <Route path="cadastro" element={<CompanyRegisterPage />} />
                <Route path="agendar" element={<PublicBookingPage />} />

                {/* Admin-only routes */}
                <Route path="admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
                <Route path="profissionais" element={<AdminRoute><ProfessionalsPage /></AdminRoute>} />
                <Route path="servicos" element={<AdminRoute><ServicesPage /></AdminRoute>} />
                <Route path="procedimentos" element={<AdminRoute><ProcedimentosPage /></AdminRoute>} />
                <Route path="financeiro" element={<AdminRoute><FinanceiroPage /></AdminRoute>} />
                <Route path="usuarios" element={<AdminRoute><UsuariosPage /></AdminRoute>} />
                <Route path="estabelecimentos" element={<AdminRoute><EstabelecimentosPage /></AdminRoute>} />
                <Route path="configuracoes" element={<AdminRoute><ConfiguracoesPage /></AdminRoute>} />
                <Route path="horarios" element={<AdminRoute><ScheduleSettingsPage /></AdminRoute>} />
                <Route path="whatsapp" element={<AdminRoute><WhatsAppSettingsPage /></AdminRoute>} />

                {/* Staff routes (admin + recepcionista) */}
                <Route path="clientes" element={<StaffRoute><ClientsPage /></StaffRoute>} />
                <Route path="atendimento" element={<StaffRoute><WhatsAppChatPage /></StaffRoute>} />

                {/* Agenda: admin, profissional, recepcionista */}
                <Route path="agenda" element={<AgendaRoute><AgendaPage /></AgendaRoute>} />

                {/* Authenticated user routes */}
                <Route path="meu-perfil" element={<UserRoute><MeuPerfilPage /></UserRoute>} />
                <Route path="meus-agendamentos" element={<UserRoute><UserBookingPage /></UserRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

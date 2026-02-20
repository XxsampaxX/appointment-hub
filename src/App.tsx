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
import ProfessionalsPage from "./pages/ProfessionalsPage";
import UserBookingPage from "./pages/UserBookingPage";
import PublicBookingPage from "./pages/PublicBookingPage";
import NotFound from "./pages/NotFound";
import CompanySelectPage from "./pages/CompanySelectPage";
import HomePage from "./pages/HomePage";
import GlobalLoginPage from "./pages/GlobalLoginPage";
import MasterAdminPage from "./pages/MasterAdminPage";
import CreateCompanyPage from "./pages/CreateCompanyPage";
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
  // Wait for role to be fully resolved (null means still loading)
  if (companyRole === null) return <LoadingScreen />;
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
              <Route path="/admin-master" element={<MasterRoute><MasterAdminPage /></MasterRoute>} />
              <Route path="/admin-master/nova-empresa" element={<MasterRoute><CreateCompanyPage /></MasterRoute>} />

              {/* All company routes under /:slug */}
              <Route path="/:slug" element={<CompanySlugWrapper />}>
                <Route index element={<CompanyLoginPage />} />
                <Route path="login" element={<CompanyLoginPage />} />
                <Route path="cadastro" element={<CompanyRegisterPage />} />
                <Route path="agendar" element={<PublicBookingPage />} />

                {/* Staff/Admin routes */}
                <Route path="admin" element={<StaffRoute><Dashboard /></StaffRoute>} />
                <Route path="profissionais" element={<AdminRoute><ProfessionalsPage /></AdminRoute>} />
                <Route path="servicos" element={<AdminRoute><ServicesPage /></AdminRoute>} />
                <Route path="clientes" element={<StaffRoute><ClientsPage /></StaffRoute>} />
                <Route path="agenda" element={<StaffRoute><AgendaPage /></StaffRoute>} />

                {/* User routes */}
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

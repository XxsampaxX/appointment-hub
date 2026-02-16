import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { CompanyProvider, useCompanyContext } from "@/contexts/CompanyContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ServicesPage from "./pages/ServicesPage";
import ClientsPage from "./pages/ClientsPage";
import AgendaPage from "./pages/AgendaPage";
import ProfessionalsPage from "./pages/ProfessionalsPage";
import UserBookingPage from "./pages/UserBookingPage";
import PublicBookingPage from "./pages/PublicBookingPage";
import CompanyLoginPage from "./pages/CompanyLoginPage";
import CompanyRegisterPage from "./pages/CompanyRegisterPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();
  const { companyRole, loading: companyLoading } = useCompanyContext();
  if (loading || companyLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (companyRole !== "admin") return <Navigate to="/meus-agendamentos" replace />;
  return <>{children}</>;
}

function StaffRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();
  const { companyRole, loading: companyLoading } = useCompanyContext();
  if (loading || companyLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!companyRole || companyRole === "user") return <Navigate to="/meus-agendamentos" replace />;
  return <>{children}</>;
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuthContext();
  const { companyRole, loading: companyLoading } = useCompanyContext();

  if (loading || companyLoading) return <LoadingScreen />;

  const homeRedirect = isAuthenticated
    ? (companyRole === "admin" || companyRole === "recepcionista")
      ? "/dashboard"
      : "/meus-agendamentos"
    : undefined;

  return (
    <Routes>
      {/* Company-specific login/register */}
      <Route path="/empresa/:slug" element={<CompanyLoginPage />} />
      <Route path="/empresa/:slug/cadastro" element={<CompanyRegisterPage />} />

      {/* Public booking by slug */}
      <Route path="/agendamento/:slug" element={<PublicBookingPage />} />

      <Route path="/" element={homeRedirect ? <Navigate to={homeRedirect} replace /> : <Login />} />
      <Route path="/cadastro" element={isAuthenticated ? <Navigate to={homeRedirect!} replace /> : <Register />} />

      {/* Admin routes */}
      <Route path="/dashboard" element={<StaffRoute><Dashboard /></StaffRoute>} />
      <Route path="/profissionais" element={<AdminRoute><ProfessionalsPage /></AdminRoute>} />
      <Route path="/servicos" element={<AdminRoute><ServicesPage /></AdminRoute>} />
      <Route path="/clientes" element={<StaffRoute><ClientsPage /></StaffRoute>} />
      <Route path="/agenda" element={<StaffRoute><AgendaPage /></StaffRoute>} />

      {/* User routes */}
      <Route path="/meus-agendamentos" element={<UserRoute><UserBookingPage /></UserRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <AppRoutes />
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

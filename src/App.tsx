import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ServicesPage from "./pages/ServicesPage";
import ClientsPage from "./pages/ClientsPage";
import AgendaPage from "./pages/AgendaPage";
import ProfessionalsPage from "./pages/ProfessionalsPage";
import BookingPage from "./pages/BookingPage";
import UserBookingPage from "./pages/UserBookingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Rota protegida para admin
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useAuthContext();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (currentUser?.role !== "admin") return <Navigate to="/meus-agendamentos" replace />;
  return <>{children}</>;
}

// Rota protegida para usuário comum
function UserRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, currentUser } = useAuthContext();

  const homeRedirect = isAuthenticated
    ? currentUser?.role === "admin"
      ? "/dashboard"
      : "/meus-agendamentos"
    : undefined;

  return (
    <Routes>
      {/* Rota pública de agendamento (sem login) */}
      <Route path="/agendar" element={<BookingPage />} />

      {/* Auth */}
      <Route path="/" element={homeRedirect ? <Navigate to={homeRedirect} replace /> : <Login />} />
      <Route path="/cadastro" element={isAuthenticated ? <Navigate to={homeRedirect!} replace /> : <Register />} />

      {/* Admin */}
      <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/profissionais" element={<AdminRoute><ProfessionalsPage /></AdminRoute>} />
      <Route path="/servicos" element={<AdminRoute><ServicesPage /></AdminRoute>} />
      <Route path="/clientes" element={<AdminRoute><ClientsPage /></AdminRoute>} />
      <Route path="/agenda" element={<AdminRoute><AgendaPage /></AdminRoute>} />

      {/* Usuário comum */}
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

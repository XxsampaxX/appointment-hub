import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

// Página pública de agendamento agora redireciona para login
// Agendamento requer autenticação
export default function BookingPage() {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to="/meus-agendamentos" replace />;
  }

  return <Navigate to="/" replace />;
}

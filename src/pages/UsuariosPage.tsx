import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Pencil, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  companyName: string;
  createdAt: string;
}

export default function UsuariosPage() {
  const { company, loading: cl } = useCompanyContext();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!company?.id) return;
    (async () => {
      setLoading(true);
      const { data: members } = await supabase
        .from("company_members")
        .select("user_id, role, created_at, company_id")
        .eq("company_id", company.id);

      if (!members?.length) { setUsers([]); setLoading(false); return; }

      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, phone")
        .in("id", userIds);

      const rows: UserRow[] = members.map((m) => {
        const p = profiles?.find((pr) => pr.id === m.user_id);
        return {
          userId: m.user_id,
          name: p?.name || "—",
          email: p?.email || "—",
          phone: p?.phone || "—",
          role: m.role,
          companyName: company.name,
          createdAt: new Date(m.created_at).toLocaleDateString("pt-BR"),
        };
      });
      setUsers(rows);
      setLoading(false);
    })();
  }, [company?.id]);

  const roleLabel: Record<string, string> = {
    admin: "Admin", profissional: "Profissional", recepcionista: "Recepcionista", user: "Usuário",
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (cl || loading) {
    return <SidebarLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></SidebarLayout>;
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Estabelecimento</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">Nenhum usuário encontrado</td></tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.userId} className="border-b border-border hover:bg-muted/20">
                        <td className="p-3 font-medium">{u.name}</td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">{u.phone}</td>
                        <td className="p-3"><Badge variant="secondary">{roleLabel[u.role] || u.role}</Badge></td>
                        <td className="p-3">{u.companyName}</td>
                        <td className="p-3">{u.createdAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}

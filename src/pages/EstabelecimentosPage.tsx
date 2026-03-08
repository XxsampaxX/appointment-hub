import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompanyRow {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export default function EstabelecimentosPage() {
  const { company, loading: cl } = useCompanyContext();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    setLoading(true);
    const { data } = await supabase.from("companies").select("id, name, status, created_at").order("created_at", { ascending: false });
    setCompanies(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const toggleStatus = async (c: CompanyRow) => {
    const newStatus = c.status === "active" ? "suspended" : "active";
    const { error } = await supabase.from("companies").update({ status: newStatus }).eq("id", c.id);
    if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
    toast({ title: `Empresa ${newStatus === "active" ? "ativada" : "suspensa"}` });
    fetchCompanies();
  };

  if (cl || loading) {
    return <SidebarLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></SidebarLayout>;
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Estabelecimentos</h1>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Criado em</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr><td colSpan={4} className="text-center p-8 text-muted-foreground">Nenhum estabelecimento</td></tr>
                  ) : (
                    companies.map((c) => (
                      <tr key={c.id} className="border-b border-border hover:bg-muted/20">
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3">
                          <Badge variant={c.status === "active" ? "default" : "destructive"}>
                            {c.status === "active" ? "Ativo" : c.status === "suspended" ? "Suspenso" : c.status}
                          </Badge>
                        </td>
                        <td className="p-3">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="p-3">
                          <Button size="sm" variant="outline" onClick={() => toggleStatus(c)}>
                            {c.status === "active" ? "Suspender" : "Ativar"}
                          </Button>
                        </td>
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

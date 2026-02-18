import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Building2, Loader2 } from "lucide-react";

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export default function CompanySelectPage() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("companies")
      .select("id, name, slug, logo")
      .order("name")
      .then(({ data }) => {
        setCompanies(data || []);
        setLoading(false);
      });
  }, []);

  const handleSelect = (company: CompanyOption) => {
    localStorage.setItem("selectedCompany", JSON.stringify({ id: company.id, slug: company.slug }));
    navigate(`/${company.slug}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold">AgendaCRM</h1>
          <p className="text-muted-foreground">Selecionar Ambiente</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : companies.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhuma empresa cadastrada.</p>
        ) : (
          <div className="space-y-3">
            {companies.map((company) => (
              <Card
                key={company.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleSelect(company)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{company.name}</span>
                  </div>
                  <Button size="sm">Acessar</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

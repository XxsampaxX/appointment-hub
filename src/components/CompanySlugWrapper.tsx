import { useEffect } from "react";
import { useParams, Outlet } from "react-router-dom";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Loader2, Building2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CompanySlugWrapper() {
  const { slug } = useParams<{ slug: string }>();
  const { company, loading, setSlug, slug: contextSlug } = useCompanyContext();

  useEffect(() => {
    if (slug) {
      setSlug(slug);
    }
  }, [slug, setSlug]);

  if (loading || (slug && contextSlug !== slug)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardContent className="pt-6 text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Empresa não encontrada</h2>
            <p className="text-muted-foreground">
              Não encontramos nenhuma empresa com o identificador "<strong>{slug}</strong>".
            </p>
            <a href="/">
              <Button variant="outline" className="mt-2">Voltar ao início</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (company.status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-destructive/30">
          <CardContent className="pt-6 text-center space-y-4">
            <Building2 className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Empresa Suspensa</h2>
            <p className="text-muted-foreground">
              Esta empresa está temporariamente suspensa. Entre em contato com o suporte.
            </p>
            <a href="/">
              <Button variant="outline" className="mt-2">Voltar ao início</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}

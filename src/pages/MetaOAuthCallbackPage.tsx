import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MetaOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const companyId = searchParams.get("state"); // We'll pass companyId via state param

    if (!code) {
      setStatus("error");
      setMessage("Código de autorização não encontrado na URL.");
      return;
    }

    if (!companyId) {
      setStatus("error");
      setMessage("ID da empresa não encontrado. Tente novamente pela página de configurações.");
      return;
    }

    async function exchangeCode() {
      try {
        const { data, error } = await supabase.functions.invoke("whatsapp-oauth-callback", {
          body: { code, companyId },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setStatus("success");
        setPhone(data.phone || "");
        setMessage("WhatsApp conectado com sucesso!");
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Erro ao conectar WhatsApp.");
      }
    }

    exchangeCode();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Conectando WhatsApp...</p>
              <p className="text-sm text-muted-foreground">Aguarde enquanto processamos a autorização.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">{message}</p>
              {phone && <p className="text-sm text-muted-foreground">Número: {phone}</p>}
              <Button onClick={() => window.close()} className="mt-2">
                Fechar janela
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium">Erro na conexão</p>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button variant="outline" onClick={() => window.close()} className="mt-2">
                Fechar janela
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

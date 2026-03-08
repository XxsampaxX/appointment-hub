import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Validate caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse body
    const body = await req.json();
    const { companyName, document, businessType } = body;

    if (!companyName?.trim()) {
      return new Response(JSON.stringify({ error: "Nome da empresa é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate slug
    const slug = companyName
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. Check slug uniqueness
    const { data: existing } = await adminClient
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: `Slug "${slug}" já existe. Escolha outro nome.` }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Check if user already owns a pending company
    const { data: existingMembership } = await adminClient
      .from("company_members")
      .select("id, company_id")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (existingMembership && existingMembership.length > 0) {
      // Check if any of those companies are pending
      const companyIds = existingMembership.map((m: any) => m.company_id);
      const { data: pendingCompanies } = await adminClient
        .from("companies")
        .select("id")
        .in("id", companyIds)
        .eq("status", "pending");

      if (pendingCompanies && pendingCompanies.length > 0) {
        return new Response(JSON.stringify({ error: "Você já tem uma empresa aguardando aprovação." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 5. Create company with status "pending"
    const validBusinessTypes = ["clinic", "nail_designer", "beauty", "therapy", "service"];
    const finalBusinessType = validBusinessTypes.includes(businessType) ? businessType : "service";

    const { data: companyData, error: companyError } = await adminClient
      .from("companies")
      .insert({
        name: companyName.trim(),
        slug,
        document: (document || "").trim(),
        status: "pending",
        created_by: user.id,
        business_type: finalBusinessType,
      })
      .select("id")
      .single();

    if (companyError || !companyData) {
      return new Response(JSON.stringify({ error: `Erro ao criar empresa: ${companyError?.message || "unknown"}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = companyData.id;

    // 6. Link owner as admin
    const { error: memberError } = await adminClient
      .from("company_members")
      .insert({
        user_id: user.id,
        company_id: companyId,
        role: "admin",
      });

    if (memberError) {
      await adminClient.from("companies").delete().eq("id", companyId);
      return new Response(JSON.stringify({ error: `Erro ao vincular dono: ${memberError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Create free subscription
    const { error: subError } = await adminClient
      .from("subscriptions")
      .insert({
        company_id: companyId,
        plan: "free",
        status: "active",
        max_appointments_month: 50,
      });

    if (subError) {
      await adminClient.from("company_members").delete().eq("company_id", companyId);
      await adminClient.from("companies").delete().eq("id", companyId);
      return new Response(JSON.stringify({ error: `Erro ao criar assinatura: ${subError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8. Notify master admin via email
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      try {
        // Get master admin emails
        const { data: masterAdmins } = await adminClient
          .from("global_roles")
          .select("user_id")
          .eq("role", "master_admin");

        if (masterAdmins && masterAdmins.length > 0) {
          const userIds = masterAdmins.map((m: any) => m.user_id);
          const { data: profiles } = await adminClient
            .from("profiles")
            .select("email")
            .in("id", userIds);

          const emails = (profiles || []).map((p: any) => p.email).filter(Boolean);

          if (emails.length > 0) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "Agendya <confirmacao@agendya.app>",
                to: emails,
                subject: `Nova empresa aguardando aprovação: ${companyName.trim()}`,
                html: `
                  <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;">
                    <h2>Nova empresa cadastrada</h2>
                    <p>A empresa <strong>${companyName.trim()}</strong> foi cadastrada e aguarda sua aprovação.</p>
                    <p><strong>Dono:</strong> ${user.email}</p>
                    <p><strong>Slug:</strong> ${slug}</p>
                    <a href="https://agendya.app/admin-master" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:white;border-radius:8px;text-decoration:none;margin-top:12px;">Revisar no Painel</a>
                  </div>
                `,
              }),
            });
          }
        }
      } catch (_) {
        // Email failure should not block
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        company: { id: companyId, slug, name: companyName.trim(), status: "pending" },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

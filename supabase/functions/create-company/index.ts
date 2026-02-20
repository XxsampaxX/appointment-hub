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

    // 1. Validate caller is master_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claims.claims.sub as string;

    // Use service role to check master admin
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: roleData } = await adminClient
      .from("global_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "master_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: master_admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate body
    const body = await req.json();
    const { companyName, document, plan, status, ownerName, ownerEmail, ownerPassword, sendEmail } = body;

    if (!companyName?.trim() || !ownerName?.trim() || !ownerEmail?.trim() || !ownerPassword?.trim()) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: companyName, ownerName, ownerEmail, ownerPassword" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ownerPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validPlans = ["free", "basic", "pro"];
    const validStatuses = ["active", "suspended"];
    const finalPlan = validPlans.includes(plan) ? plan : "free";
    const finalStatus = validStatuses.includes(status) ? status : "active";

    // Generate slug from company name
    const slug = companyName
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // 3. Check if slug already exists
    const { data: existingCompany } = await adminClient
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingCompany) {
      return new Response(JSON.stringify({ error: `Slug "${slug}" já existe. Escolha outro nome.` }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Try to create user or reuse existing one
    let ownerId: string;
    let userCreated = false;

    // First try to find existing user by email using admin API
    let existingUser: any = null;
    const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers();
    if (allUsers) {
      existingUser = allUsers.find(
        (u: any) => u.email?.toLowerCase() === ownerEmail.trim().toLowerCase()
      );
    }

    if (existingUser) {
      // Reuse existing user
      ownerId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
        email: ownerEmail.trim(),
        password: ownerPassword,
        email_confirm: true,
        user_metadata: {
          name: ownerName.trim(),
          phone: "",
          cpf: "",
        },
      });

      if (userError || !newUser?.user) {
        return new Response(JSON.stringify({ error: `Erro ao criar usuário: ${userError?.message || "unknown"}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      ownerId = newUser.user.id;
      userCreated = true;
    }

    // 6. STEP 2 — Create company
    const { data: companyData, error: companyError } = await adminClient
      .from("companies")
      .insert({
        name: companyName.trim(),
        slug,
        document: (document || "").trim(),
        status: finalStatus,
        created_by: callerId,
      })
      .select("id")
      .single();

    if (companyError || !companyData) {
      // Rollback: delete user only if newly created
      if (userCreated) await adminClient.auth.admin.deleteUser(ownerId);
      return new Response(JSON.stringify({ error: `Erro ao criar empresa: ${companyError?.message || "unknown"}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = companyData.id;

    // 7. STEP 3 — Link owner to company
    const { error: memberError } = await adminClient
      .from("company_members")
      .insert({
        user_id: ownerId,
        company_id: companyId,
        role: "admin",
      });

    if (memberError) {
      // Rollback
      await adminClient.from("companies").delete().eq("id", companyId);
      if (userCreated) await adminClient.auth.admin.deleteUser(ownerId);
      return new Response(JSON.stringify({ error: `Erro ao vincular dono: ${memberError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8. STEP 4 — Create subscription
    const planLimits: Record<string, number | null> = { free: 50, basic: 200, pro: null };
    const { error: subError } = await adminClient
      .from("subscriptions")
      .insert({
        company_id: companyId,
        plan: finalPlan,
        status: "active",
        max_appointments_month: planLimits[finalPlan],
      });

    if (subError) {
      // Rollback
      await adminClient.from("company_members").delete().eq("company_id", companyId);
      await adminClient.from("companies").delete().eq("id", companyId);
      if (userCreated) await adminClient.auth.admin.deleteUser(ownerId);
      return new Response(JSON.stringify({ error: `Erro ao criar assinatura: ${subError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 9. Optional: send credentials email
    if (sendEmail) {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Agendya <confirmacao@agendya.com.br>",
              to: [ownerEmail.trim()],
              subject: `Bem-vindo ao Agendya — ${companyName.trim()}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;">
                  <h2>Bem-vindo ao Agendya!</h2>
                  <p>Sua empresa <strong>${companyName.trim()}</strong> foi criada com sucesso.</p>
                  <p><strong>Seus dados de acesso:</strong></p>
                  <ul>
                    <li><strong>Email:</strong> ${ownerEmail.trim()}</li>
                    <li><strong>Senha:</strong> ${ownerPassword}</li>
                  </ul>
                  <p>Acesse o sistema pelo link:</p>
                  <a href="https://agendya.com.br/${slug}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:white;border-radius:8px;text-decoration:none;">Acessar Agendya</a>
                  <p style="margin-top:16px;color:#888;font-size:12px;">Recomendamos alterar sua senha no primeiro acesso.</p>
                </div>
              `,
            }),
          });
        } catch (_) {
          // Email failure should not block company creation
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        company: { id: companyId, slug, name: companyName.trim() },
        owner: { id: ownerId, email: ownerEmail.trim() },
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

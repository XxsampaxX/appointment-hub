import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find appointments in the next ~60-65 min that haven't had reminders sent
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 65 * 60 * 1000);
    const fiftyFiveMin = new Date(now.getTime() + 55 * 60 * 1000);

    const todayStr = now.toISOString().split("T")[0];
    const oneHourDate = oneHourFromNow.toISOString().split("T")[0];

    // Get appointments for today or tomorrow (edge case around midnight)
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, date, time, client_name, client_phone, client_id, company_id, service_id, professional_id")
      .eq("reminder_sent", false)
      .in("status", ["agendado", "confirmado"])
      .in("date", [todayStr, oneHourDate]);

    if (error) {
      console.error("[Reminders] Query error:", error);
      throw error;
    }

    console.log(`[Reminders] Found ${appointments?.length || 0} candidates`);

    const sendWhatsappUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp`;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

    let sent = 0;

    for (const apt of appointments || []) {
      // Check if appointment is within 55-65 min window
      const aptDateTime = new Date(`${apt.date}T${apt.time}`);
      if (aptDateTime < fiftyFiveMin || aptDateTime > oneHourFromNow) {
        continue;
      }

      // Get phone: from appointment or from client record
      let phone = apt.client_phone;
      let clientName = apt.client_name || "";

      if (!phone && apt.client_id) {
        const { data: client } = await supabase
          .from("clients")
          .select("phone, name")
          .eq("id", apt.client_id)
          .single();
        if (client) {
          phone = client.phone;
          if (!clientName) clientName = client.name;
        }
      }

      if (!phone) {
        console.log(`[Reminders] No phone for appointment ${apt.id}, skipping`);
        continue;
      }

      // Send reminder
      try {
        const res = await fetch(sendWhatsappUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            phone,
            messageType: "lembrete",
            variables: { name: clientName, time: apt.time },
            appointmentId: apt.id,
          }),
        });
        await res.text();

        // Mark reminder as sent
        await supabase
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", apt.id);

        sent++;
        console.log(`[Reminders] Sent reminder for appointment ${apt.id}`);
      } catch (err) {
        console.error(`[Reminders] Failed for ${apt.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Reminders] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

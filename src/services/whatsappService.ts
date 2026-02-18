import { supabase } from "@/integrations/supabase/client";

export async function sendWhatsAppConfirmation({
  phone,
  name,
  date,
  time,
  appointmentId,
}: {
  phone: string;
  name: string;
  date: string;
  time: string;
  appointmentId?: string;
}) {
  if (!phone) {
    console.log("[WhatsApp] No phone provided, skipping confirmation");
    return;
  }

  try {
    const dateFormatted = new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        phone,
        messageType: "confirmacao",
        variables: { name, date: dateFormatted, time },
        appointmentId,
      },
    });

    if (error) {
      console.error("[WhatsApp] Confirmation error:", error);
    } else {
      console.log("[WhatsApp] Confirmation sent:", data);
    }
  } catch (err) {
    console.error("[WhatsApp] Confirmation failed:", err);
  }
}

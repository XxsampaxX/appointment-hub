import type { BusinessType } from "@/types";

export const businessTypeLabels: Record<string, string> = {
  clinic: "Clínica / Estética",
  nail_designer: "Nail Designer",
  beauty: "Salão / Barbearia",
  therapy: "Terapias",
  service: "Serviços",
  other: "Outro",
};

export function getBusinessTypeLabel(type?: string | null): string {
  return type ? businessTypeLabels[type] || "Outro" : "Não definido";
}

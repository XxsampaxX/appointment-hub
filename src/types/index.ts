// Tipos do sistema de agendamento multi-tenant

export type AppRole = "admin" | "profissional" | "recepcionista" | "user";
export type AppointmentStatus = "agendado" | "confirmado" | "concluido" | "cancelado" | "nao_compareceu";
export type PaymentMethod = "pix" | "dinheiro" | "credito" | "debito";
export type SubscriptionStatus = "free" | "pro" | "premium";

export type BusinessType = "beleza" | "saude" | "fitness" | "educacao" | "servicos" | "outros";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  phone: string;
  address: string;
  document: string;
  status: "active" | "suspended" | "pending";
  workingHoursStart: string;
  workingHoursEnd: string;
  slotDuration: number;
  slotInterval: number;
  workingDays: number[];
  subscriptionStatus: SubscriptionStatus;
  maxAppointmentsMonth?: number;
  businessType?: BusinessType;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: AppRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  role: AppRole;
  companyId?: string;
}

export interface Professional {
  id: string;
  companyId: string;
  name: string;
  role: string;
  avatar?: string;
  available: boolean;
}

export interface Service {
  id: string;
  companyId: string;
  name: string;
  duration: number;
  price: number;
  description: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface Appointment {
  id: string;
  companyId: string;
  clientId: string;
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
  clientName?: string;
  clientPhone?: string;
  paymentMethod?: PaymentMethod | null;
}

export interface BusinessSettings {
  name: string;
  logo?: string;
  workingHours: {
    start: string;
    end: string;
  };
  slotDuration: number;
}

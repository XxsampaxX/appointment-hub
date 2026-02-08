// Tipos do sistema de agendamento

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string; // ex: "Barbeiro", "Cabeleireiro"
  avatar?: string;
  available: boolean;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // em minutos
  price: number;
  description: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string; // WhatsApp
  notes: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  professionalId: string;
  date: string; // ISO date string
  time: string; // HH:mm
  status: "agendado" | "concluido" | "cancelado";
  notes: string;
  // Dados do cliente para agendamentos públicos (cliente não cadastrado)
  clientName?: string;
  clientPhone?: string;
}

export interface BusinessSettings {
  name: string;
  logo?: string;
  workingHours: {
    start: string; // "09:00"
    end: string; // "19:00"
  };
  slotDuration: number; // em minutos
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  date: string; // ISO date string
  time: string; // HH:mm
  status: "agendado" | "concluido" | "cancelado";
  notes: string;
}

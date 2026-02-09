// Tipos do sistema de agendamento

export interface User {
  id: string;
  name: string;
  phone: string; // usado como login
  cpf: string; // usado como senha
  role: "admin" | "user";
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  available: boolean;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  status: "agendado" | "concluido" | "cancelado";
  notes: string;
  clientName?: string;
  clientPhone?: string;
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

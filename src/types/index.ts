// Tipos do sistema de agendamento

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
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
  phone: string;
  notes: string;
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

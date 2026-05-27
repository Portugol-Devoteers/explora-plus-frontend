import { api } from "./api";

export type TicketStatus = "valid" | "used" | "expired";

export type Ticket = {
  id: string;
  placeId: string;
  placeName: string;
  thumb: string;
  date: string;
  time: string;
  quantity: number;
  totalLabel: string;
  status: TicketStatus;
  code: string;
};

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; color: string; background: string }
> = {
  valid: { label: "Válido", color: "#1B7F3A", background: "#D6F5DD" },
  used: { label: "Utilizado", color: "#5A5A5A", background: "#EFEFF2" },
  expired: { label: "Expirado", color: "#9A2A2A", background: "#FBE0E0" },
};

export async function fetchTickets(): Promise<Ticket[]> {
  const data = await api<unknown>("/api/tickets/");
  if (!Array.isArray(data)) return [];
  return data as Ticket[];
}

export type CreateTicketPayload = {
  placeId: string;
  quantity: number;
};

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket | null> {
  const data = await api<unknown>("/api/tickets/", {
    method: "POST",
    body: payload,
  });
  if (!data || typeof data !== "object" || !("id" in (data as object))) return null;
  return data as Ticket;
}

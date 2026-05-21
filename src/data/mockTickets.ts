export type TicketStatus = "valid" | "used" | "expired";

export type MockTicket = {
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

export const MOCK_TICKETS: MockTicket[] = [
  {
    id: "t1",
    placeId: "torre-catedral",
    placeName: "Torre da Catedral",
    thumb:
      "https://images.unsplash.com/photo-1583779457094-ab6f9164a1c8?w=400&q=80",
    date: "Sáb, 24 mai",
    time: "10:30",
    quantity: 2,
    totalLabel: "€ 24,00",
    status: "valid",
    code: "EXP-7821-CTH",
  },
  {
    id: "t2",
    placeId: "mirante-velho",
    placeName: "Mirante Antigo",
    thumb:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",
    date: "Dom, 25 mai",
    time: "17:00",
    quantity: 1,
    totalLabel: "€ 5,00",
    status: "valid",
    code: "EXP-3344-MRT",
  },
  {
    id: "t3",
    placeId: "torre-catedral",
    placeName: "Torre da Catedral",
    thumb:
      "https://images.unsplash.com/photo-1583779457094-ab6f9164a1c8?w=400&q=80",
    date: "Ter, 06 mai",
    time: "14:15",
    quantity: 1,
    totalLabel: "€ 12,00",
    status: "used",
    code: "EXP-0091-CTH",
  },
];

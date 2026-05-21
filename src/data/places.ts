export type PlaceKind = "monumento" | "evento";

export type Place = {
  id: string;
  kind: PlaceKind;
  images: string[];
  distanceKm: number;
  hours: string;
  priceLabel: string;
  name: string;
  about: string;
  mapPosition: { top: string; left: string };
};

export const PLACES: Place[] = [
  {
    id: "torre-catedral",
    kind: "monumento",
    images: [
      "https://images.unsplash.com/photo-1583779457094-ab6f9164a1c8?w=900&q=80",
      "https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=900&q=80",
      "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80",
      "https://images.unsplash.com/photo-1564604761-2c5dbf6f7da9?w=900&q=80",
    ],
    distanceKm: 0.5,
    hours: "09:00 - 18:00",
    priceLabel: "R$ 12,00",
    name: "Torre da Catedral",
    about:
      "Construída no século XIV, a Torre da Catedral é um exemplo magnífico da arquitetura gótica. Esse monumento histórico testemunhou séculos de história e segue como um dos marcos mais icônicos da cidade. Visitantes podem subir os 287 degraus para apreciar vistas panorâmicas do centro antigo e da paisagem ao redor.",
    mapPosition: { top: "18%", left: "38%" },
  },
  {
    id: "festival-luzes",
    kind: "evento",
    images: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80",
    ],
    distanceKm: 1.2,
    hours: "20:00 - 23:00",
    priceLabel: "Grátis",
    name: "Festival de Luzes",
    about:
      "Um evento noturno onde monumentos e fachadas históricas ganham vida com projeções de luz e arte digital. Acontece em datas selecionadas e atrai visitantes do mundo todo.",
    mapPosition: { top: "38%", left: "68%" },
  },
  {
    id: "praca-central",
    kind: "monumento",
    images: [
      "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=900&q=80",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=900&q=80",
    ],
    distanceKm: 0.8,
    hours: "Sempre aberta",
    priceLabel: "Grátis",
    name: "Praça Central",
    about:
      "O coração da cidade antiga, com cafés, artistas de rua e arquitetura preservada do início do século XIX. Ponto de encontro tradicional e parada obrigatória para fotos.",
    mapPosition: { top: "52%", left: "55%" },
  },
  {
    id: "feira-artesanato",
    kind: "evento",
    images: [
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&q=80",
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=900&q=80",
    ],
    distanceKm: 1.5,
    hours: "10:00 - 19:00",
    priceLabel: "Grátis",
    name: "Feira de Artesanato",
    about:
      "Feira semanal com artesãos locais expondo cerâmica, têxteis, joias e gastronomia regional. Ocorre todo sábado na orla.",
    mapPosition: { top: "70%", left: "25%" },
  },
  {
    id: "mirante-velho",
    kind: "monumento",
    images: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=80",
      "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=900&q=80",
    ],
    distanceKm: 0.3,
    hours: "08:00 - 20:00",
    priceLabel: "R$ 5,00",
    name: "Mirante Antigo",
    about:
      "Antiga torre de vigia transformada em mirante público, com a melhor vista do pôr-do-sol da região. Acessível por uma trilha curta a partir do centro.",
    mapPosition: { top: "85%", left: "48%" },
  },
];

export const getPlaceById = (id: string): Place | undefined =>
  PLACES.find((p) => p.id === id);

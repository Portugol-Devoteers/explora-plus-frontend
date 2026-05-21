import type { Ionicons } from "@expo/vector-icons";

export type TransportMode = "transit" | "rideshare" | "walking" | "driving";

export type MockRoute = {
  id: string;
  destinationPlaceId: string;
  destinationName: string;
  thumb: string;
  origin: string;
  generatedAt: string;
  distanceKm: number;
  durationMin: number;
  mode: TransportMode;
  saved: boolean;
};

export const TRANSPORT_META: Record<
  TransportMode,
  { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }
> = {
  transit: { label: "Ônibus / Metrô", icon: "bus" },
  rideshare: { label: "Carro de App", icon: "car" },
  walking: { label: "A pé", icon: "walk" },
  driving: { label: "Carro", icon: "car-sport" },
};

export const MOCK_ROUTES: MockRoute[] = [
  {
    id: "r1",
    destinationPlaceId: "torre-catedral",
    destinationName: "Torre da Catedral",
    thumb:
      "https://images.unsplash.com/photo-1583779457094-ab6f9164a1c8?w=400&q=80",
    origin: "Sua localização",
    generatedAt: "Hoje, 09:42",
    distanceKm: 1.8,
    durationMin: 18,
    mode: "transit",
    saved: true,
  },
  {
    id: "r2",
    destinationPlaceId: "mirante-velho",
    destinationName: "Mirante Antigo",
    thumb:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",
    origin: "Sua localização",
    generatedAt: "Ontem, 17:08",
    distanceKm: 0.3,
    durationMin: 6,
    mode: "walking",
    saved: false,
  },
  {
    id: "r3",
    destinationPlaceId: "praca-central",
    destinationName: "Praça Central",
    thumb:
      "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=400&q=80",
    origin: "Hotel Beira-Mar",
    generatedAt: "Sex, 12 mai",
    distanceKm: 0.8,
    durationMin: 11,
    mode: "walking",
    saved: true,
  },
  {
    id: "r4",
    destinationPlaceId: "festival-luzes",
    destinationName: "Festival de Luzes",
    thumb:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80",
    origin: "Sua localização",
    generatedAt: "Qui, 11 mai",
    distanceKm: 1.2,
    durationMin: 9,
    mode: "rideshare",
    saved: false,
  },
];

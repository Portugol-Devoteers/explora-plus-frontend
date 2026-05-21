export type MockUser = {
  name: string;
  email: string;
  avatarUrl: string;
  memberSince: string;
  stats: {
    routes: number;
    placesVisited: number;
    tickets: number;
  };
  preferredLanguage: "pt" | "en";
};

export const MOCK_USER: MockUser = {
  name: "Lucas Carmona",
  email: "lucas@explora.app",
  avatarUrl:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80",
  memberSince: "Membro desde maio de 2026",
  stats: {
    routes: 12,
    placesVisited: 7,
    tickets: 3,
  },
  preferredLanguage: "pt",
};

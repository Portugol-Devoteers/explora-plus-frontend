import { api } from "./api";
import type { AuthUser } from "./auth";

export type Me = {
  id: number;
  name: string;
  email: string;
  username: string;
  avatarUrl: string;
  memberSince: string;
  stats: {
    routes: number;
    placesVisited: number;
    tickets: number;
  };
  preferredLanguage: "pt" | "en";
};

function formatMemberSince(dateJoined?: string): string {
  if (!dateJoined) return "";
  const d = new Date(dateJoined);
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `Membro desde ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

function displayName(u: AuthUser): string {
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return full || u.username;
}

function avatarFor(u: AuthUser): string {
  const seed = encodeURIComponent(u.username || u.email);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=4d7cff`;
}

export async function fetchMe(): Promise<Me> {
  const u = await api<AuthUser>("/api/me/");
  return {
    id: u.id,
    name: displayName(u),
    email: u.email,
    username: u.username,
    avatarUrl: avatarFor(u),
    memberSince: formatMemberSince(u.date_joined),
    stats: { routes: 0, placesVisited: 0, tickets: 0 },
    preferredLanguage: "pt",
  };
}

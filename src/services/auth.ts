import { api } from "./api";

export type AuthTokens = { access: string; refresh: string };

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  date_joined?: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

type RegisterResponse = AuthTokens & { user: AuthUser };

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return api<RegisterResponse>("/api/auth/register/", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  return api<AuthTokens>("/api/auth/login/", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export async function refresh(refreshToken: string): Promise<{ access: string }> {
  return api<{ access: string }>("/api/auth/refresh/", {
    method: "POST",
    body: { refresh: refreshToken },
    auth: false,
  });
}

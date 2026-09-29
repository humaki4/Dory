import { ApiError, requestJson } from "@/api/httpClient";
import type {
  AuthProviderResponse,
  AuthSessionResponse,
  SupportedAuthProvider,
} from "../model/auth.types";

const anonymousSession: AuthSessionResponse = {
  authenticated: false,
  user: null,
  permissions: { administration: false },
};

export async function fetchAuthSession(): Promise<AuthSessionResponse> {
  try {
    return await requestJson<AuthSessionResponse>("/api/auth/whoami");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return anonymousSession;
    }
    throw error;
  }
}

export function fetchAuthProvider(): Promise<AuthProviderResponse> {
  return requestJson<AuthProviderResponse>("/api/auth/provider");
}

export function logout(): Promise<void> {
  return requestJson<void>("/api/auth/logout", { method: "POST" });
}

export function startProviderLogin(provider: SupportedAuthProvider) {
  window.location.href = `/api/auth/${provider}/start`;
}

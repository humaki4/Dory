import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAuthProvider,
  fetchAuthSession,
  logout,
} from "../api/auth.api";
import type { SupportedAuthProvider } from "../model/auth.types";

export { fetchAuthSession, startProviderLogin } from "../api/auth.api";
export type { SupportedAuthProvider } from "../model/auth.types";

export const authSessionQueryKey = ["auth", "session"] as const;
export const authProviderQueryKey = ["auth", "provider"] as const;

export function useAuthSession() {
  return useQuery({
    queryKey: authSessionQueryKey,
    queryFn: fetchAuthSession,
    staleTime: 1000 * 60,
  });
}

export function useAuthProvider() {
  return useQuery({
    queryKey: authProviderQueryKey,
    queryFn: fetchAuthProvider,
    staleTime: 1000 * 60 * 10,
  });
}

export function getProviderLabel(provider: SupportedAuthProvider): string {
  return provider === "gitlab" ? "GitLab" : "GitHub";
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    },
  });
}

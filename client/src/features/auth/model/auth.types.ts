export type SupportedAuthProvider = "github" | "gitlab";

export interface AuthUser {
  sub: string;
  provider: SupportedAuthProvider;
  username: string;
  displayName?: string;
  roles: string[];
  orgs: string[];
  teams: string[];
}

export interface AuthProviderResponse {
  provider: SupportedAuthProvider;
  loginPath: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
  permissions: {
    administration: boolean;
  };
}

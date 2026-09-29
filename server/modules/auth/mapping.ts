import { AuthTokenClaims } from '../../plugins/auth/auth';
import { OAuthIdentity, WhoAmIResponse } from './types';

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasIntersection(left: string[], right: string[]): boolean {
  if (left.length === 0 || right.length === 0) {
    return false;
  }

  const lookup = new Set(left.map((value) => value.toLowerCase()));
  return right.some((value) => lookup.has(value.toLowerCase()));
}

function matchesValue(input: string | undefined, allowedValues: string[]): boolean {
  if (!input || allowedValues.length === 0) {
    return false;
  }

  const normalizedInput = input.toLowerCase();
  return allowedValues.some((value) => value.toLowerCase() === normalizedInput);
}

export function resolveRoles(identity: OAuthIdentity): string[] {
  const adminUsers = parseCsv(process.env.AUTH_ADMIN_USERS);
  const adminOrgs = parseCsv(process.env.AUTH_ADMIN_ORGS);
  const adminTeams = parseCsv(process.env.AUTH_ADMIN_TEAMS);

  if (
    matchesValue(identity.username, adminUsers) ||
    hasIntersection(identity.orgs, adminOrgs) ||
    hasIntersection(identity.teams, adminTeams)
  ) {
    return ['admin'];
  }

  return ['viewer'];
}

export function mapWhoAmI(user: AuthTokenClaims | null): WhoAmIResponse {
  if (!user) {
    return {
      authenticated: false,
      user: null,
      permissions: {
        administration: false,
      },
    };
  }

  return {
    authenticated: true,
    user,
    permissions: {
      administration: user.roles.includes('admin'),
    },
  };
}

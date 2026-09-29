export type RepositoryAccessCacheEntry = {
  repos: Set<string>;
  expiresAt: number;
};

export type GithubAuthenticatedUser = {
  id: number;
  login: string;
  name?: string;
};

export type AuthorizationAction =
  | 'repositories:list'
  | 'repository:read'
  | 'administration:read'
  | 'administration:write';

export type AuthorizationResource =
  | { type: 'repository-collection' }
  | { type: 'repository'; fullName: string }
  | { type: 'administration' };

export type AuthorizationRequest = {
  action: AuthorizationAction;
  resource: AuthorizationResource;
};

export type AuthorizationRequestRepositoriesList = {
  action: 'repositories:list';
  resource: { type: 'repository-collection' };
};

export type AuthorizationRequestRepositoryRead = {
  action: 'repository:read';
  resource: { type: 'repository'; fullName: string };
};

export type AuthorizationRequestAdministrationRead = {
  action: 'administration:read';
  resource: { type: 'administration' };
};

export type AuthorizationRequestAdministrationWrite = {
  action: 'administration:write';
  resource: { type: 'administration' };
};

export type TypedAuthorizationRequest =
  | AuthorizationRequestRepositoriesList
  | AuthorizationRequestRepositoryRead
  | AuthorizationRequestAdministrationRead
  | AuthorizationRequestAdministrationWrite;

export type AuthorizationResultFor<T extends TypedAuthorizationRequest> =
  T extends AuthorizationRequestRepositoriesList ? { allowedRepositories: Set<string> } : {};

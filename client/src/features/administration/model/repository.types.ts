export interface ScannableRepository {
  id: string;
  space: string;
  name: string;
  fullPath: string;
  url: string;
  defaultBranch: string;
  isPrivate: boolean;
  updatedAt: string;
  description: string;
}

export interface ScannableRepositoriesResponse {
  provider: string;
  repositories: ScannableRepository[];
}

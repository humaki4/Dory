import { BadRequestError } from '../../core/errors';

export interface RepositoryInput {
  space: string;
  name: string;
}

export function parseGithubRepositoryInput(value: string): RepositoryInput {
  const input = value.trim();
  if (!input) {
    throw new BadRequestError('Repository is required');
  }

  let path = input;
  if (/^https?:\/\//i.test(input)) {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      throw new BadRequestError('Enter a GitHub repository URL or owner/repo');
    }

    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') {
      throw new BadRequestError('Only public GitHub repositories are supported');
    }

    path = url.pathname;
  }

  const segments = path.split('/').filter(Boolean);
  if (segments.length !== 2) {
    throw new BadRequestError('Enter a GitHub repository URL or owner/repo');
  }

  const [space, rawName] = segments;
  const name = rawName.replace(/\.git$/i, '');
  const validSegment = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

  if (
    !validSegment.test(space) ||
    !validSegment.test(name) ||
    space === '.' ||
    space === '..' ||
    name === '.' ||
    name === '..'
  ) {
    throw new BadRequestError('Enter a valid GitHub repository owner and name');
  }

  return { space: space.toLowerCase(), name: name.toLowerCase() };
}

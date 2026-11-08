import { describe, expect, it } from 'vitest';
import { parseGithubRepositoryInput } from './repositoryInput';

describe('parseGithubRepositoryInput', () => {
  it.each([
    ['acme/docs', { space: 'acme', name: 'docs' }],
    ['https://github.com/acme/docs', { space: 'acme', name: 'docs' }],
    ['https://github.com/acme/docs.git', { space: 'acme', name: 'docs' }],
    ['  acme/docs  ', { space: 'acme', name: 'docs' }],
  ])('normalizes %s', (input, expected) => {
    expect(parseGithubRepositoryInput(input)).toEqual(expected);
  });

  it.each(['', 'owner', 'owner/repo/tree/main', 'https://gitlab.com/owner/repo', 'owner/../repo'])(
    'rejects %s',
    (input) => {
      expect(() => parseGithubRepositoryInput(input)).toThrow();
    }
  );
});

# Public OSS Repositories Design

Status: Draft for review
Date: 2026-10-30

## Context

The Administration view currently lists repositories from the configured VCS provider and can scan a selected repository. The collector uses the server-level `GITHUB_TOKEN`; document and search authorization separately derives the signed-in user's accessible repositories from their OAuth token. The document browser and search only expose repositories returned by that user-specific authorization.

The provided logs show `401 Bad credentials` for GitHub API calls made by the collector, while the OAuth login succeeds. The authorization logs list 39 repositories for the signed-in user, but the document browser finds no matching ingested sources. These are separate issues: the collector token must be replaced with a valid token, and shared public repositories need an explicit authorization path.

## Goals

- Let an administrator add a public GitHub repository by URL or `owner/repo`.
- Persist added repositories so they remain in Administration after refresh.
- Scan the repository through the existing collector pipeline.
- Make successfully ingested public repositories visible to all authenticated users in the document browser and search.
- Keep private repositories restricted to users with GitHub access.

## Non-Goals

- Add GitLab, arbitrary Git hosts, or private repositories through this flow.
- Add repository removal or per-user repository subscriptions.
- Replace the existing OAuth-based access checks for private repositories.

## Decisions

### Input and validation

Accept a canonical GitHub repository URL or `owner/repo`. Normalize both to the same owner/name identity. Reject other hosts, malformed paths, and repositories that cannot be fetched. Verify repository metadata through the configured GitHub provider and reject repositories marked private before saving them.

### Persistence and scan

Add an administration-only API operation that verifies and upserts the repository in the existing MongoDB `document_sources2` registry with an explicit marker indicating that it is globally available as a public source. Re-adding the same repository is idempotent. Then run the existing repository scan and document ingestion pipeline. Store source metadata independently of whether the repository contains Markdown, so it remains selectable after a refresh even when the scan finds no documents.

The UI reports validation and scan failures. If the scan fails after repository verification, retain the registered public source and allow an administrator to retry the scan.

Public-source imports default to five Markdown files in alphabetic path order. `COLLECTOR_PUBLIC_REPOSITORY_MAX_FILES` configures the limit, with an absolute maximum of 100. At most five file requests run concurrently. Capped scans are marked partial so ingestion does not delete previously stored documents outside the current sample.

### Repository lists and authorization

The Administration repository list combines provider repositories with registered public sources, deduplicated by normalized `owner/repo`.

For `repositories:list`, authorization returns the union of the user's existing GitHub-accessible repositories and explicitly registered public sources. Document browsing and search already consume this allowed-repository set, so this preserves their existing query behavior while granting shared read access only to registered public sources. Private repositories are never added to the shared set.

### Collector credentials

Keep collector access and user OAuth authorization separate. `GITHUB_TOKEN` must be a valid server-side token for current repository listing and scans; the user's OAuth token is used for their private repository permissions. Replacing the invalid collector token is an environment operation, not part of this feature's code change.

## Risks / Trade-Offs

- A repository marked public may later become private. The shared-source path must not treat a stale registry marker as proof that the repository is still public; re-check visibility before scanning and fail closed if GitHub reports it private or inaccessible.
- The registry contains existing ingested sources, including private ones. Global visibility must use the explicit public-source marker, not merely `isPrivate: false`.
- A public import indexes only the configured sample of Markdown files, defaulting to five and capped at 100; administrators can increase the setting when needed.
- The invalid `GITHUB_TOKEN` currently prevents repository listing and scanning. Feature tests should use a mocked provider, and live verification requires rotating the exposed token and configuring a valid replacement.

## Migration Plan

No collection migration is required if the new public-source marker is optional. Existing source records remain private to their existing authorization rules. New API writes the marker only after verifying public visibility. Add an index for the marker if query volume warrants it; otherwise begin with the existing collection indexes.

Rollback consists of disabling the add operation and removing the public-source union from authorization. Existing document records remain stored and become inaccessible through the public-source path; no destructive data migration is needed.

## Validation

- Unit tests cover URL and `owner/repo` normalization, invalid input, private repository rejection, idempotent registration, and failed scans.
- Authorization tests verify that registered public sources are allowed for different authenticated users while unregistered and private sources remain denied.
- Route and service tests verify combined Administration lists and scan retry behavior.
- Client tests verify submission, loading, success, and error states, plus query refresh so the new repository appears in the dropdown and document list after a successful scan.
- Run focused server and client tests and their TypeScript checks.

## Related Documents

- [Backend testing best practices](../../../server/docs/HOWTO-backend-testing-best-practices.md)

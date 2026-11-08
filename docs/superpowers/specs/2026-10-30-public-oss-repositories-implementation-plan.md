# Public OSS Repositories Implementation Plan

Status: Draft for review
Related design: [Public OSS Repositories Design](2026-10-30-public-oss-repositories-design.md)

## 1. Persist And Validate Public Repositories

- [ ] 1.1 Add repository input normalization for GitHub URLs and `owner/repo`; test valid forms, malformed input, and unsupported hosts.
- [ ] 1.2 Add an administration-only registration route that fetches repository metadata, rejects private/inaccessible repositories, and upserts an explicit public-source marker in `document_sources2`; verify route errors and idempotent storage with focused service and route tests.
- [ ] 1.3 Reuse the collector scan pipeline after registration, default to five files, allow `COLLECTOR_PUBLIC_REPOSITORY_MAX_FILES` up to 100, limit concurrency to five, and preserve the registered source when a scan fails; verify partial-scan deletion safety and retry behavior.

## 2. Expose Shared Public Content

- [ ] 2.1 Extend repository authorization to union explicitly marked public sources with the signed-in user's existing repository set; test access for multiple users and denial of unregistered/private sources.
- [ ] 2.2 Include registered public sources in the Administration repository list without duplicates; verify provider and stored repositories combine correctly.
- [ ] 2.3 Verify document browsing, content reads, and search can reach registered public sources through the allowed-repository set; run focused server tests.

## 3. Add The Administration Input

- [ ] 3.1 Add a labeled GitHub URL or `owner/repo` input and add action with pending, validation, success, and error states; verify with focused client tests and TypeScript checks.
- [ ] 3.2 Refresh repository and document queries after successful add/scan so the source appears in Administration and the document browser; verify query invalidation and UI behavior.

## 4. Integration Verification

- [ ] 4.1 Run focused server and client tests, lint, and typechecks; confirm existing private-repository authorization behavior remains unchanged.
- [ ] 4.2 Update API/setup documentation for adding public GitHub sources and required collector credentials; verify documented endpoint and input formats match implementation.

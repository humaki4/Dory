## Plan: Search/Browse Boundaries Hardening

Stabilize the architecture around `Git = source of truth`, `MongoDB = read model`, and `single active search path` so the codebase is maintainable now and portable to PostgreSQL later. The recommended approach is to first remove ambiguity (dead/parallel implementations), then introduce explicit domain contracts (DTOs/repositories), then normalize data shape and ingestion behavior behind interfaces that can be reimplemented for Postgres.

**Where boundaries are currently not clean**

1. Two competing search architectures exist in parallel, one unused.
2. Route layer is directly coupled to Mongo search implementation.
3. Collector has storage assumptions instead of pure event/port responsibility.
4. API/domain fields and persistence fields are inconsistent (camelCase/snake_case, IDs, repo references).
5. Search index responsibility is implicitly spread across modules.

**Steps**

1. Phase 1: Choose one active search architecture and remove contradictory code paths. Keep `MongoDBSearchService` as canonical now, and either delete or quarantine Meili-specific dead code (`SearchIngestService`, `SearchService`) behind an explicit feature flag and module boundary. This step blocks all others because current duplication hides true ownership.
2. Phase 1: Define explicit ownership boundaries in module contracts. Collector publishes domain events only; documents module owns projection persistence; search module owns query APIs only. Remove direct collector dependence on storage internals by introducing a repository/sync-source port used by collector startup logic. _depends on 1_
3. Phase 2: Introduce canonical API/domain DTOs independent of persistence naming (`sourceId`, `repoRef`, `updatedAt`, etc.) and add mapper layer in persistence adapters. Stop leaking DB field names into route responses. _depends on 1_
4. Phase 2: Extract storage/query interfaces (`DocumentRepository`, `RepositoryProjectionStore`, `SearchQueryRepository`) and move Mongo aggregation/query details behind adapter implementations. Routes should depend on services + DTOs, not Mongo filters or Set shape assumptions. _depends on 3_
5. Phase 2: Normalize identity model with explicit stable IDs for repository and document identity in domain layer (document key from provider/repo/path), while keeping Mongo `_id` internal. Ensure all writes/upserts and reads use canonical identifiers. _parallel with 4_
6. Phase 3: Normalize metadata strategy for migration-readiness: split metadata into `typed promoted fields` (type, tags, status, priority, author, date) plus `metadata_extra` dynamic object; add validation/versioning (`metadataVersion`) at ingestion boundaries. _depends on 3_
7. Phase 3: Make ingestion/event handling idempotent and auditable: define dedupe key and processing semantics for repeated events; centralize sync lifecycle state transitions; avoid split-brain updates across collections. _depends on 5_
8. Phase 3: Consolidate index/query responsibilities: index creation for search-related queries must be owned by one place with health checks at startup; remove hidden dependency where search relies on documents module indexes implicitly. _depends on 4_
9. Phase 4: Prepare PostgreSQL migration seam without migrating yet: implement a Postgres-shaped repository contract test suite, add export/backfill format (NDJSON), and build parity tests that compare Mongo adapter behavior to contract expectations. _depends on 4,6,7_
10. Phase 4: Add observability guardrails: structured metrics for search latency/hit-rate/fallback usage and ingestion lag/error rates to decide when Mongo limits are reached and migration is justified. _parallel with 9_

**Relevant files**

- `/home/martina/Development/docAtlas/server/modules/search/routes.ts` — route-to-storage coupling; inject service interface instead of concrete Mongo service.
- `/home/martina/Development/docAtlas/server/modules/search/mongoDbSearchService.ts` — split into query adapter + mapper + domain service; remove persistence leakage.
- `/home/martina/Development/docAtlas/server/modules/search/ingestService.ts` — currently dead/duplicate path; remove or isolate behind feature flag.
- `/home/martina/Development/docAtlas/server/modules/search/searchService.ts` — currently dead reader path; remove or align with chosen architecture.
- `/home/martina/Development/docAtlas/server/modules/search/index.ts` — module wiring point; enforce single active implementation.
- `/home/martina/Development/docAtlas/server/modules/documents/ingestService.ts` — canonical projection write model, idempotent upsert and metadata normalization entry point.
- `/home/martina/Development/docAtlas/server/modules/documents/browseService.ts` — browse DTO boundary; avoid DB-shape leakage and inconsistent metadata typing.
- `/home/martina/Development/docAtlas/server/modules/documents/index.ts` — event subscriptions and lifecycle coordination.
- `/home/martina/Development/docAtlas/server/modules/collector/service.ts` — remove direct storage assumptions from startup/resync flow via port abstraction.
- `/home/martina/Development/docAtlas/server/plugins/mongodb.ts` — infrastructure binding only; keep DB concerns out of domain services.

**Verification**

1. Contract tests: routes/services return stable DTO schema independent of Mongo field names.
2. Architecture tests: no module outside persistence adapters imports Mongo query operators/types.
3. Idempotency tests: repeated `collector.document.processed` events do not create divergent state.
4. Search behavior tests: repository/space/global search semantics unchanged after refactor.
5. Index health checks: startup verifies required indexes exist and logs drift.
6. Migration readiness tests: export snapshot can be mapped into Postgres-shaped schema without lossy transforms for promoted metadata fields.
7. Performance baseline: capture p95 search latency and ingestion throughput before/after refactor.

**Decisions**

- Included scope: architectural refactor and boundary hardening for maintainability + future PostgreSQL portability.
- Excluded scope: immediate database migration and Meili reintroduction as active path.
- Assumption: product direction remains `Git truth`, read-only browse/search projection.

**Further considerations**

1. Delete dead Meili code now vs keep behind disabled feature flag. Recommendation: delete unless near-term reactivation is planned.
2. Canonical naming strategy at API boundary: use domain-friendly camelCase and map in adapters.
3. Metadata promotion policy: start with a fixed allowlist + versioning, then evolve via telemetry.

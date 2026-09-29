import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import buildApp from '../../app';
import type { CollectorDocumentProcessedEvent } from './events';

type RepositoriesResponse = {
  repositories?: unknown[];
};

type ScanResponse = Record<string, unknown>;

function parseJson<T>(payload: string): T {
  return JSON.parse(payload) as T;
}

async function testCollector() {
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;

  try {
    app = await buildApp({ logLevel: 'info' });
    await app.ready();
    app.log.info('✓ App is ready');

    // Subscribe to collector events and log them
    app.eventBus.subscribe(
      'collector.document.processed',
      (event: CollectorDocumentProcessedEvent) => {
        app?.log.info({ event }, '✓ EVENT: collector.document.processed');
      }
    );
    app.log.info('✓ Event listener registered');

    app.log.info('→ Attempting to list repositories...');
    const response = await app.inject({
      method: 'GET',
      url: '/api/collector/repositories',
    });

    app.log.info({ statusCode: response.statusCode }, '✓ List repositories response');

    if (response.statusCode !== 200) {
      app.log.error({ payload: response.payload }, '✗ Error listing repositories');
      await app.close();
      process.exit(1);
    }

    const data = parseJson<RepositoriesResponse>(response.payload);
    app.log.info({ repositoryCount: data.repositories?.length || 0 }, '✓ Repositories found');

    // Test: Scan first repository if available
    // if (data.repositories && data.repositories.length > 0) {
    const firstRepo = { space: 'ximuva02', name: 'docAtlas' };
    app.log.info(firstRepo, '→ Scanning repository');

    const scanResponse = await app.inject({
      method: 'POST',
      url: `/api/collector/repositories/${firstRepo.space}/${firstRepo.name}/scan`,
    });

    app.log.info({ statusCode: scanResponse.statusCode }, '✓ Scan response');

    if (scanResponse.statusCode === 200) {
      const scanData = parseJson<ScanResponse>(scanResponse.payload);
      app.log.info({ scanData }, '✓ Scan results');
    } else {
      app.log.error({ payload: scanResponse.payload }, '✗ Error scanning repository');
    }
    // } else {
    //   app.log.warn('⚠ No repositories found');
    // }

    // Give events time to process
    app.log.info('→ Waiting for events to process...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await app.close();
    app.log.info('✓ Test completed');
    process.exit(0);
  } catch (error) {
    if (app) {
      app.log.error({ error }, '✗ FATAL ERROR');
    } else {
      process.stderr.write(`✗ FATAL ERROR (before app init): ${String(error)}\n`);
    }
    process.exit(1);
  }
}

void testCollector();

import fastify from 'fastify';
import path from 'path';
import autoload from '@fastify/autoload';
import { FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { inferErrorCode, inferStatusCode } from './core/errors';

function getPublicErrorMessage(error: unknown, statusCode: number): string {
  if (statusCode >= 500) {
    return 'Internal Server Error';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unexpected error';
}

export function registerGlobalErrorHandlers(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Route not found',
      requestId: request.id,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = inferStatusCode(error);
    const code = inferErrorCode(error, statusCode);
    const message = getPublicErrorMessage(error, statusCode);

    app.log.error({ err: error, requestId: request.id }, 'Request failed');

    reply.code(statusCode).send({
      statusCode,
      code,
      message,
      requestId: request.id,
    });
  });
}

async function buildApp(opts: { logLevel?: string } = {}) {
  const app = fastify({
    logger: {
      level: opts.logLevel || process.env.LOG_LEVEL || 'trace',
      ...(process.env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:mm:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
    },
    ...opts,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerGlobalErrorHandlers(app);

  // Auto-load custom plugins from plugins directory
  app.register(autoload, {
    dir: path.join(__dirname, 'plugins'),
    ignorePattern: /\.test\.ts$/,
  });

  // Auto-load routes from modules directory
  app.register(autoload, {
    dir: path.join(__dirname, 'modules'),
    ignorePattern: /\.test\.ts$/,
    forceESM: false,
    options: { prefix: '/api' },
  });

  return app;
}

export default buildApp;

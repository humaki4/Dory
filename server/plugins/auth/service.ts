import { FastifyRequest } from 'fastify';
import { AuthTokenClaims } from './auth';

type RequestWithCurrentUser<T> = FastifyRequest & { currentUser?: T };

export async function verifyAndAttachUser<T extends AuthTokenClaims>(
  request: FastifyRequest,
  token: string,
  verify: (token: string) => Promise<T>
): Promise<T> {
  const user = await verify(token);
  (request as RequestWithCurrentUser<T>).currentUser = user;
  return user;
}

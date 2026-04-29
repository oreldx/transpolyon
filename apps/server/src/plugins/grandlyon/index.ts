import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createGrandLyonClient } from './client.ts';

export type GrandLyonClient = ReturnType<typeof createGrandLyonClient>;

export default fp(
	async (fastify: FastifyInstance) => {
		const grandLyonClient = createGrandLyonClient(fastify);
		fastify.decorate('grandLyonClient', grandLyonClient);
	},
	{
		name: 'grand-lyon-client',
	},
);

declare module 'fastify' {
	interface FastifyInstance {
		grandLyonClient: GrandLyonClient;
	}
}

import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createVelovService } from './service.ts';

export default fp(
	async (fastify: FastifyInstance) => {
		const velovService = createVelovService(fastify);
		fastify.decorate('velovService', velovService);
	},
	{
		name: 'velov-service',
	},
);

declare module 'fastify' {
	interface FastifyInstance {
		velovService: ReturnType<typeof createVelovService>;
	}
}

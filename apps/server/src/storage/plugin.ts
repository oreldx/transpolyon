import fp from 'fastify-plugin';
import { openDatabase } from './database.ts';
import { createStationStore } from './stations.ts';

export default fp<{ databasePath?: string }>(
	async (fastify, options) => {
		const database = openDatabase(
			options.databasePath ?? process.env.VELOV_DATABASE_PATH ?? './data/transpolyon.sqlite',
		);
		fastify.addHook('onClose', async () => database.close());
		fastify.decorate('velovStore', createStationStore(database));
	},
	{ name: 'velov-storage' },
);

declare module 'fastify' {
	interface FastifyInstance {
		velovStore: ReturnType<typeof createStationStore>;
	}
}

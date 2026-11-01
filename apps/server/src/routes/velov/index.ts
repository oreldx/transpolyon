import { type FastifyPluginAsync } from 'fastify';

const velovRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
	const { velovService } = fastify;

	fastify.get('/', async () => {
		const res = await velovService.getStations();
		return res;
	});

	fastify.get('/tracked-stations', async () => ({
		stations: fastify.velovStore.getTrackedStations(),
	}));

	fastify.put<{ Body: { stationIds: number[] } }>(
		'/tracked-stations',
		{
			preValidation: async (request, reply) => {
				// Reject numeric strings before Fastify's default schema coercion.
				if (
					!Array.isArray(request.body?.stationIds) ||
					request.body.stationIds.some((id) => typeof id !== 'number')
				) {
					return reply.code(400).send({ error: 'Station identifiers must be numbers' });
				}
			},
			schema: {
				body: {
					type: 'object',
					required: ['stationIds'],
					additionalProperties: false,
					properties: {
						stationIds: {
							type: 'array',
							uniqueItems: true,
							maxItems: 10000,
							items: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { stationIds } = request.body;
			// Clearing the list remains possible while the provider is unavailable.
			let catalogue;
			try {
				catalogue = stationIds.length ? await velovService.getCatalogue() : [];
			} catch {
				return reply.code(503).send({ error: 'Station catalogue is unavailable' });
			}
			const known = new Set(catalogue.map((station) => station.id));
			const unknownStationIds = stationIds.filter((id) => !known.has(id));
			if (unknownStationIds.length) {
				return reply.code(400).send({ error: 'Unknown station identifiers', unknownStationIds });
			}
			return { stations: fastify.velovStore.replaceTrackedStations(stationIds, catalogue) };
		},
	);
};

export default velovRoutes;

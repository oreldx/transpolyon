import { type FastifyPluginAsync } from 'fastify';

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	const { velovService } = fastify;

	fastify.get('/', async function (request, reply) {
		const res = await velovService.getStations();
		return res;
	});
};

export default example;

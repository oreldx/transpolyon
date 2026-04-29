import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const velovStationFieldSchema = z.enum([
	'number',
	'name',
	'address',
	'address2',
	'address_jcd',
	'commune',
	'nmarrond',
	'bonus',
	'pole',
	'bike_stands',
	'available_bike_stands',
	'available_bikes',
	'availabilitycode',
	'availability',
	'status',
	'banking',
	'lat',
	'lng',
	'gid',
	'last_update',
	'last_update_fme',
	'last_update_gl',
	'code_insee',
	'langue',
	'etat',
	'nature',
	'titre',
	'description',
	'startdate',
	'enddate',
	'overflow',
	'total_stands',
	'main_stands',
	'overflow_stands',
]);

const velovStationAvailabilitiesSchema = z.object({
	bikes: z.number(),
	electricalBikes: z.number(),
	electricalInternalBatteryBikes: z.number(),
	electricalRemovableBatteryBikes: z.number(),
	mechanicalBikes: z.number(),
	stands: z.number(),
});

const velovStationStandsSchema = z.object({
	availabilities: velovStationAvailabilitiesSchema,
	capacity: z.number(),
});

const rawVelovStationSchema = z.object({
	address: z.string().nullable(),
	address2: z.string().nullable(),
	address_jcd: z.string(),
	availability: z.string(),
	availabilitycode: z.number(),
	available_bike_stands: z.number(),
	available_bikes: z.number(),
	banking: z.boolean(),
	bike_stands: z.number(),
	bonus: z.boolean(),
	code_insee: z.string().nullable(),
	commune: z.string().nullable(),
	description: z.string().nullable(),
	enddate: z.string().nullable(),
	etat: z.string().nullable(),
	gid: z.number(),
	langue: z.string().nullable(),
	last_update: z.string().nullable(),
	last_update_fme: z.string().nullable(),
	last_update_gl: z.string().nullable(),
	lat: z.number(),
	lng: z.number(),
	main_stands: velovStationStandsSchema,
	name: z.string(),
	nature: z.string().nullable(),
	nmarrond: z.number().nullable(),
	number: z.number(),
	overflow: z.boolean(),
	overflow_stands: velovStationStandsSchema.nullable(),
	pole: z.string().nullable(),
	startdate: z.string().nullable(),
	status: z.string(),
	titre: z.string().nullable(),
	total_stands: velovStationStandsSchema,
});

const rawVelovStationsLiveResponseSchema = z.object({
	fields: z.array(velovStationFieldSchema),
	layer_name: z.string(),
	nb_results: z.number(),
	table_alias: z.string().nullable(),
	table_href: z.string(),
	values: z.array(rawVelovStationSchema),
});

export type VelovStationField = z.infer<typeof velovStationFieldSchema>;
export type VelovStationAvailabilities = z.infer<typeof velovStationAvailabilitiesSchema>;
export type VelovStationStands = z.infer<typeof velovStationStandsSchema>;
export type RawVelovStation = z.infer<typeof rawVelovStationSchema>;
export type RawVelovStationsLiveResponse = z.infer<typeof rawVelovStationsLiveResponseSchema>;

export const createVelovRepo = (fastify: FastifyInstance) => {
	return {
		async getStationsLive(): Promise<RawVelovStationsLiveResponse> {
			const endpoint = '/jcd_jcdecaux.jcdvelov/all.json';
			const res = await fastify.grandLyonClient.fetch<RawVelovStationsLiveResponse>(endpoint);

			const validation = rawVelovStationsLiveResponseSchema.safeParse(res);

			if (!validation.success) {
				fastify.log.error(
					{ res, errors: z.formatError(validation.error) },
					'Invalid response from Velov API',
				);
				throw new Error('Invalid response from Velov API');
			}

			return validation.data;
		},
	};
};

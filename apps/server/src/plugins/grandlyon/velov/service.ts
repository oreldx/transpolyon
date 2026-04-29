import type { FastifyInstance } from 'fastify';
import { createVelovRepo, type RawVelovStation } from './repo.ts';

interface VelovStation {
	id: number;
	name: string;
	coordinates: {
		lat: number;
		lng: number;
	};
	bikes: {
		normal: number;
		electric: number;
	};
	availableSpots: number;
	address: string;
}

export const createVelovService = (fastify: FastifyInstance) => {
	const velovRepo = createVelovRepo(fastify);

	const formatStation = (rawStation: RawVelovStation): VelovStation => {
		const availabilities = rawStation.total_stands.availabilities;

		return {
			id: rawStation.number,
			name: rawStation.name,
			coordinates: {
				lat: rawStation.lat,
				lng: rawStation.lng,
			},
			bikes: {
				normal: availabilities.mechanicalBikes,
				electric: availabilities.electricalBikes,
			},
			availableSpots: availabilities.stands,
			address: rawStation.address ?? '',
		};
	};

	return {
		async getStations() {
			const rawStations = await velovRepo.getStationsLive();
			const formattedStations = rawStations.values.map(formatStation);
			return formattedStations;
		},
	};
};

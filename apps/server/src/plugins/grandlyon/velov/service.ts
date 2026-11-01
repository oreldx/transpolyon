import type { FastifyInstance } from 'fastify';
import { createVelovRepo, type RawVelovStation } from './repo.ts';
import type { Station } from '../../../velov/contracts.ts';

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
		async getCatalogue(): Promise<Station[]> {
			const rawStations = await velovRepo.getStationsLive();
			const collectedAt = new Date().toISOString();
			return rawStations.values.map((station) => ({
				id: station.number,
				name: station.name,
				address: station.address,
				latitude: station.lat,
				longitude: station.lng,
				status: station.status,
				capacity: station.total_stands.capacity,
				source: 'grandlyon-live',
				sourceUpdatedAt: station.last_update,
				collectedAt,
			}));
		},
		async getStations() {
			const rawStations = await velovRepo.getStationsLive();
			const formattedStations = rawStations.values.map(formatStation);
			return formattedStations;
		},
	};
};

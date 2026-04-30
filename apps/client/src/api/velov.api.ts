import { apiFetch } from './http';

export type Station = {
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
};

export function getVelov() {
	return apiFetch<Station[]>('/velov', { method: 'GET' });
}

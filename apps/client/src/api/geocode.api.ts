import { apiFetch } from './http';

type GeocodeResult = {
	type: string;
	features: {
		type: string;
		geometry: {
			type: string;
			coordinates: number[];
		};
		properties: {
			label: string;
			score: number;
			housenumber: string;
			id: string;
			banId: string;
			name: string;
			postcode: string;
			citycode: string;
			x: number;
			y: number;
			city: string;
			district: string;
			context: string;
			type: string;
			importance: number;
			depcode: string;
			street: string;
			_type: string;
		};
	}[];
	query: string;
};

export const getGeocodeSearch = ({
	address,
	autocomplete = 1,
	index = 'address',
	limit = 10,
	returntruegeometry = false,
}: {
	address: string;
	autocomplete?: number;
	index?: string;
	limit?: number;
	returntruegeometry?: boolean;
}): Promise<GeocodeResult> => {
	const query = new URLSearchParams({
		q: address,
		autocomplete: autocomplete.toString(),
		index,
		limit: limit.toString(),
		returntruegeometry: returntruegeometry.toString(),
	}).toString();

	return apiFetch<GeocodeResult>(
		`/search?${query}`,
		{ method: 'GET' },
		'https://data.geopf.fr/geocodage',
	);
};

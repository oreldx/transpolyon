import { getGeocodeSearch } from '@/api/geocode.api';
import { ref } from 'vue';

export function useGeocode() {
	const isLoading = ref(false);
	const error = ref<Error | null>(null);
	const data = ref<Awaited<ReturnType<typeof getGeocodeSearch>> | null>(null);

	async function search(address: string) {
		isLoading.value = true;
		error.value = null;

		try {
			data.value = await getGeocodeSearch({ address });
		} catch (err) {
			error.value = err as Error;
		} finally {
			isLoading.value = false;
		}
	}

	return {
		data,
		isLoading,
		error,
		search,
	};
}

import { getVelov, type Station } from '@/api/velov.api';
import { ref } from 'vue';

export function useVelov() {
	const stations = ref<Station[]>([]);
	const isLoading = ref(false);
	const error = ref<Error | null>(null);

	async function fetchStations() {
		isLoading.value = true;
		error.value = null;

		try {
			stations.value = await getVelov();
		} catch (err) {
			error.value = err as Error;
		} finally {
			isLoading.value = false;
		}
	}

	return {
		stations,
		isLoading,
		error,
		fetchStations,
	};
}

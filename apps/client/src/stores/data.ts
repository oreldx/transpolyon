import { useVelov } from '@/composables/useVelov';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDataStore = defineStore('data', () => {
	const { stations, isLoading, error, fetchStations } = useVelov();
	const hasLoaded = ref(false);

	const ensureStationsLoaded = async (force = false) => {
		if (!force && hasLoaded.value) {
			return;
		}

		await fetchStations();
		hasLoaded.value = true;
	};

	const refetch = async () => {
		await ensureStationsLoaded(true);
	};

	void ensureStationsLoaded();

	// TODO: add auto-refresh with setInterval and clear it on unmount

	return {
		stations,
		isLoading,
		error,
		hasLoaded,
		ensureStationsLoaded,
		refetch,
	};
});

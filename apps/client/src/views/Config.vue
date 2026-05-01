<script setup lang="ts">
import type { Station } from '@/api/velov.api';
import AppPage from '@/components/AppPage.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import LeafletCentroidMap from '@/components/LeafletCentroidMap.vue';
import BikeBasket from '@/components/icons/BikeBasket.vue';
import { useDataStore } from '@/stores/data';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';

type StationListType = 'departure' | 'arrival';

const dataStore = useDataStore();
const { stations, isLoading, error } = storeToRefs(dataStore);
const { refetch } = dataStore;

const departureStations = ref<Station[]>([]);
const arrivalStations = ref<Station[]>([]);
const isModalOpen = ref(false);
const currentList = ref<StationListType>('departure');
const selectedStations = ref<Station[]>([]);

const map = shallowRef<L.Map | null>(null);
const stationLayer = shallowRef<L.LayerGroup | null>(null);

const allSelectedStationIds = computed(
	() =>
		new Set([
			...departureStations.value.map((station) => station.id),
			...arrivalStations.value.map((station) => station.id),
		]),
);

const remainingStations = computed(() =>
	stations.value.filter((station) => !allSelectedStationIds.value.has(station.id)),
);

const departureNodes = computed(() =>
	departureStations.value.map((station) => ({
		lat: station.coordinates.lat,
		lng: station.coordinates.lng,
	})),
);

const arrivalNodes = computed(() =>
	arrivalStations.value.map((station) => ({
		lat: station.coordinates.lat,
		lng: station.coordinates.lng,
	})),
);

const monitorUrl = computed(() => {
	const params = new URLSearchParams();
	departureStations.value.forEach((station) => params.append('departure', station.id.toString()));
	arrivalStations.value.forEach((station) => params.append('arrival', station.id.toString()));

	return `/monitor?${params.toString()}`;
});

const initializeMap = async () => {
	if (map.value) {
		map.value.invalidateSize();
		return;
	}

	await nextTick();

	map.value = L.map('config-station-map').setView([45.75, 4.85], 14);
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	}).addTo(map.value);

	stationLayer.value = L.layerGroup().addTo(map.value);
	renderStationMarkers();
};

const destroyMap = () => {
	if (map.value) {
		map.value.remove();
		map.value = null;
		stationLayer.value = null;
	}
};

const renderStationMarkers = () => {
	if (!map.value || !stationLayer.value) {
		return;
	}

	stationLayer.value.clearLayers();

	remainingStations.value.forEach((station) => {
		const isSelected = selectedStations.value.some((s) => s.id === station.id);
		const marker = L.marker([station.coordinates.lat, station.coordinates.lng], {
			title: station.name,
			opacity: isSelected ? 0.5 : 1,
			riseOnHover: true,
			interactive: !isSelected,
			alt: station.name,
		}).addTo(stationLayer.value!);

		if (isSelected) {
			return;
		}
		marker.on('click', () => {
			selectedStations.value = [...selectedStations.value, station];
		});
	});
};

const openStationModal = async (listType: StationListType) => {
	currentList.value = listType;
	selectedStations.value = [];
	isModalOpen.value = true;

	if (!stations.value.length && !isLoading.value) {
		await refetch();
	}

	await initializeMap();
};

const closeStationModal = () => {
	isModalOpen.value = false;
	selectedStations.value = [];
	destroyMap();
};

const confirmSelectedStation = () => {
	if (!selectedStations.value.length) {
		return;
	}

	if (currentList.value === 'departure') {
		departureStations.value = [...departureStations.value, ...selectedStations.value];
	} else {
		arrivalStations.value = [...arrivalStations.value, ...selectedStations.value];
	}

	closeStationModal();
};

const removeStation = (listType: StationListType, stationId: number) => {
	if (listType === 'departure') {
		departureStations.value = departureStations.value.filter((station) => station.id !== stationId);
	} else {
		arrivalStations.value = arrivalStations.value.filter((station) => station.id !== stationId);
	}
};

watch([remainingStations, selectedStations], () => {
	if (isModalOpen.value) {
		renderStationMarkers();
	}
});

onBeforeUnmount(() => {
	destroyMap();
});
</script>

<template>
	<AppPage title="Config">
		<div class="flex flex-col gap-6">
			<h2
				class="mb-6 flex items-center gap-2 text-2xl font-bold tracking-tight text-text md:text-3xl"
			>
				<BaseIcon iconName="classic bike" width="24" height="24" iconColor="#4A5568">
					<BikeBasket />
				</BaseIcon>
				Velov configuration
			</h2>
			<section class="grid gap-4 md:grid-cols-2">
				<article
					class="rounded-lg border border-border bg-surface p-4 shadow-card flex flex-col gap-2"
				>
					<header class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold text-text">Departure</h3>
						<button
							type="button"
							class="rounded-md bg-line-2 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-info"
							@click="openStationModal('departure')"
						>
							Append
						</button>
					</header>

					<ul v-if="departureStations.length" class="flex flex-col gap-1">
						<li
							v-for="station in departureStations"
							:key="station.id"
							class="flex items-center justify-between rounded-md border border-border bg-bg px-3 py-2"
						>
							<div>
								<p class="text-sm font-medium text-text">{{ station.name }}</p>
								<p class="text-xs text-text-muted">{{ station.address }}</p>
							</div>
							<button
								type="button"
								class="rounded px-2 py-1 text-xs font-medium text-error hover:bg-red-50"
								@click="removeStation('departure', station.id)"
							>
								Remove
							</button>
						</li>
					</ul>
					<p v-else class="text-sm text-text-muted">No departure station selected.</p>
				</article>

				<article
					class="rounded-lg border border-border bg-surface p-4 shadow-card flex flex-col gap-2"
				>
					<header class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold text-text">Arrival</h3>
						<button
							type="button"
							class="rounded-md bg-line-1 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-error"
							@click="openStationModal('arrival')"
						>
							Append
						</button>
					</header>

					<ul v-if="arrivalStations.length" class="flex flex-col gap-1">
						<li
							v-for="station in arrivalStations"
							:key="station.id"
							class="flex items-center justify-between rounded-md border border-border bg-bg px-3 py-2"
						>
							<div>
								<p class="text-sm font-medium text-text">{{ station.name }}</p>
								<p class="text-xs text-text-muted">{{ station.address }}</p>
							</div>
							<button
								type="button"
								class="rounded px-2 py-1 text-xs font-medium text-error hover:bg-red-50"
								@click="removeStation('arrival', station.id)"
							>
								Remove
							</button>
						</li>
					</ul>
					<p v-else class="text-sm text-text-muted">No arrival station selected.</p>
				</article>
			</section>

			<!-- TODO: fix mobile overlap issue -->
			<div class="z-0">
				<LeafletCentroidMap :departure-nodes="departureNodes" :arrival-nodes="arrivalNodes" />
			</div>

			<p v-if="error" class="text-sm text-error">
				{{ error.message }}
			</p>

			<div
				v-if="isModalOpen"
				class="fixed inset-0 z-100 flex items-end bg-black/35 md:items-center md:justify-center"
			>
				<div
					class="w-full bg-surface md:h-[80vh] md:max-w-6xl md:rounded-lg md:border md:border-border"
				>
					<header class="flex items-center justify-between border-b border-border px-4 py-3">
						<h3 class="text-base font-semibold text-text">Select a station</h3>
						<button
							type="button"
							class="rounded px-2 py-1 text-sm text-text-muted hover:bg-bg"
							@click="closeStationModal"
						>
							Close
						</button>
					</header>

					<div class="grid h-[70vh] grid-cols-1 md:grid-cols-[1fr_320px]">
						<div class="relative h-full">
							<div id="config-station-map" class="h-full w-full" />
							<div
								v-if="isLoading"
								class="absolute inset-0 flex items-center justify-center bg-surface/75 text-sm text-text-muted"
							>
								Loading stations...
							</div>
						</div>

						<aside class="border-t border-border p-4 md:border-l md:border-t-0">
							<h4 class="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
								Selected stations
							</h4>

							<!-- TODO: handle map overflow + overlap on responsive -->
							<div v-if="selectedStations.length > 0" class="flex flex-col gap-4">
								<div
									v-for="station in selectedStations"
									:key="station.id"
									class="rounded-md border border-border bg-bg p-3 relative"
								>
									<p class="text-sm font-semibold text-text">{{ station.name }}</p>
									<p class="text-xs text-text-muted">{{ station.address }}</p>
									<button
										type="button"
										class="absolute top-2 right-2 rounded px-1 text-xs text-error hover:bg-red-50"
										@click="selectedStations = selectedStations.filter((s) => s.id !== station.id)"
									>
										✕
									</button>
								</div>

								<button
									type="button"
									class="w-full rounded-md bg-text px-3 py-2 text-sm font-medium text-surface transition-colors hover:opacity-90"
									@click="confirmSelectedStation"
								>
									Confirm for {{ currentList }}
								</button>
							</div>

							<p v-else class="text-sm text-text-muted">
								Click a marker on the map to select a station.
							</p>

							<p
								v-if="!isLoading && !remainingStations.length"
								class="mt-3 rounded border border-warning/40 bg-amber-50 px-3 py-2 text-xs text-amber-800"
							>
								All available stations are already selected.
							</p>
						</aside>
					</div>
				</div>
			</div>
			<div class="flex justify-end">
				<a
					class="rounded-md bg-line-3 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-success"
					:class="{
						'opacity-50 pointer-events-none':
							departureStations.length === 0 || !arrivalStations.length,
					}"
					:href="monitorUrl"
					>Monitor</a
				>
			</div>
		</div>
	</AppPage>
</template>

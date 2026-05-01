<script setup lang="ts">
import type { Station } from '@/api/velov.api';
import BaseIcon from '@/components/BaseIcon.vue';
import BikeBasket from '@/components/icons/BikeBasket.vue';
import ElectricBike from '@/components/icons/ElectricBike.vue';
import { useDataStore } from '@/stores/data';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { storeToRefs } from 'pinia';
import { onMounted, ref, watch, type Ref } from 'vue';

const initialMap: Ref<L.Map | null> = ref(null);
const selectedStation: Ref<Station | null> = ref(null);

const dataStore = useDataStore();
const { stations } = storeToRefs(dataStore);

const addPin = (station: Station) => {
	if (initialMap.value) {
		const marker = L.marker([station.coordinates.lat, station.coordinates.lng]).addTo(
			initialMap.value,
		);
		marker.on('click', () => {
			selectedStation.value = station;
		});
	}
};

onMounted(() => {
	initialMap.value = L.map('map').setView([45.75, 4.85], 14);
	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	}).addTo(initialMap.value);
	if (stations.value.length > 0) {
		stations.value.forEach((station) => {
			addPin(station);
		});
	}
});

watch(stations, (newStations) => {
	if (initialMap.value) {
		newStations.forEach((station) => {
			addPin(station);
		});
	}
});
</script>

<template>
	<div class="flex flex-col md:flex-row w-full h-screen">
		<div id="map" class="flex-1 md:flex-1 z-0" />

		<div
			v-if="selectedStation"
			class="fixed bottom-0 left-0 right-0 z-50 md:relative md:w-80 bg-white shadow-lg md:shadow-xl p-6 overflow-y-auto max-h-96 md:max-h-full md:border-l border-gray-200"
		>
			<button
				@click="selectedStation = null"
				class="mb-4 text-gray-500 hover:text-gray-700 font-bold text-lg"
			>
				✕
			</button>

			<h2 class="text-xl md:text-2xl font-bold mb-2">{{ selectedStation.name }}</h2>
			<p class="text-sm md:text-base text-gray-600 mb-4">{{ selectedStation.address }}</p>

			<div class="space-y-4">
				<div class="bg-gray-100 p-4 rounded">
					<h3 class="font-semibold text-gray-700 mb-2">Bikes Available</h3>
					<div class="flex items-center gap-2">
						<BaseIcon iconName="classic bike" width="24" height="24" iconColor="#4A5568">
							<BikeBasket />
						</BaseIcon>
						<p class="text-sm text-gray-600">
							Normal: <span class="font-bold">{{ selectedStation.bikes.normal }}</span>
						</p>
					</div>
					<div class="flex items-center gap-2">
						<BaseIcon iconName="electric bike" width="24" height="24" iconColor="#4A5568">
							<ElectricBike />
						</BaseIcon>
						<p class="text-sm text-gray-600">
							Electric: <span class="font-bold">{{ selectedStation.bikes.electric }}</span>
						</p>
					</div>
				</div>

				<div class="bg-gray-100 p-4 rounded">
					<h3 class="font-semibold text-gray-700 mb-2">Available Spots</h3>
					<p class="text-lg font-bold text-gray-800">{{ selectedStation.availableSpots }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Station } from '@/api/velov.api';
import AppPage from '@/components/AppPage.vue';
import LeafletCentroidMap from '@/components/LeafletCentroidMap.vue';
import { useDataStore } from '@/stores/data';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const dataStore = useDataStore();
const { stations } = storeToRefs(dataStore);

const minimumDepartureBikes = 3;
const minimumArrivalSlots = 5;

const parseStationIds = (queryParam: unknown): string[] => {
	if (!queryParam) {
		return [];
	}

	return Array.isArray(queryParam) ? queryParam.map(String) : [String(queryParam)];
};

const totalBikes = (station: Station) => station.bikes.normal + station.bikes.electric;

const centroidOf = (selectedStations: Station[]) => {
	if (!selectedStations.length) {
		return null;
	}

	const summed = selectedStations.reduce(
		(acc, station) => {
			acc.lat += station.coordinates.lat;
			acc.lng += station.coordinates.lng;
			return acc;
		},
		{ lat: 0, lng: 0 },
	);

	return {
		lat: summed.lat / selectedStations.length,
		lng: summed.lng / selectedStations.length,
	};
};

const findClosestToCentroid = (candidates: Station[], centroid: { lat: number; lng: number }) => {
	if (!candidates.length) {
		return null;
	}

	const closestStation = candidates.reduce(
		(closest, station) => {
			const distance = Math.sqrt(
				Math.pow(station.coordinates.lat - centroid.lat, 2) +
					Math.pow(station.coordinates.lng - centroid.lng, 2),
			);

			return distance < closest.distance ? { station, distance } : closest;
		},
		{ station: null as Station | null, distance: Infinity },
	);

	return closestStation.station;
};

const toGoogleMapsPoint = (station: Station) =>
	`${station.coordinates.lat},${station.coordinates.lng}`;

const toGoogleMapsDirectionsUrl = (origin: Station, destination: Station) => {
	const params = new URLSearchParams({
		api: '1',
		origin: toGoogleMapsPoint(origin),
		destination: toGoogleMapsPoint(destination),
		travelmode: 'bicycling',
	});

	return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const departures = computed(() => {
	const ids = parseStationIds(route.query.departure);
	return stations.value.filter((station) => ids.includes(station.id.toString()));
});

const arrivals = computed(() => {
	const ids = parseStationIds(route.query.arrival);
	return stations.value.filter((station) => ids.includes(station.id.toString()));
});

const availableDepartures = computed(() =>
	departures.value.filter((station) => totalBikes(station) > minimumDepartureBikes),
);

const availableArrivals = computed(() =>
	arrivals.value.filter((station) => station.availableSpots >= minimumArrivalSlots),
);

const departureNodes = computed(() =>
	availableDepartures.value.map((station) => ({
		lat: station.coordinates.lat,
		lng: station.coordinates.lng,
	})),
);

const arrivalNodes = computed(() =>
	availableArrivals.value.map((station) => ({
		lat: station.coordinates.lat,
		lng: station.coordinates.lng,
	})),
);

const isPathPossible = computed(
	() => availableDepartures.value.length > 0 && availableArrivals.value.length > 0,
);

const alternativeDeparture = computed(() => {
	if (availableDepartures.value.length > 0) {
		return null;
	}
	const centroid = centroidOf(departures.value);
	if (!centroid) {
		return null;
	}

	return findClosestToCentroid(
		stations.value.filter((station) => totalBikes(station) > minimumDepartureBikes),
		centroid,
	);
});

const alternativeArrival = computed(() => {
	if (availableArrivals.value.length > 0) {
		return null;
	}
	const centroid = centroidOf(arrivals.value);
	if (!centroid) {
		return null;
	}

	return findClosestToCentroid(
		stations.value.filter((station) => station.availableSpots >= minimumArrivalSlots),
		centroid,
	);
});

const departureStatusLabel = computed(() =>
	availableDepartures.value.length
		? `${availableDepartures.value.length} available`
		: 'No available departure station',
);

const arrivalStatusLabel = computed(() =>
	availableArrivals.value.length
		? `${availableArrivals.value.length} available`
		: 'No available arrival station',
);

const selectedDepartureForDirections = computed(() => {
	const centroid = centroidOf(departures.value);
	if (!centroid) {
		return null;
	}

	return (
		findClosestToCentroid(availableDepartures.value, centroid) ?? alternativeDeparture.value ?? null
	);
});

const selectedArrivalForDirections = computed(() => {
	const centroid = centroidOf(arrivals.value);
	if (!centroid) {
		return null;
	}

	return (
		findClosestToCentroid(availableArrivals.value, centroid) ?? alternativeArrival.value ?? null
	);
});

const alternativeDirectionsUrl = computed(() => {
	if (!selectedDepartureForDirections.value || !selectedArrivalForDirections.value) {
		return null;
	}

	return toGoogleMapsDirectionsUrl(
		selectedDepartureForDirections.value,
		selectedArrivalForDirections.value,
	);
});

const isDepartureAvailable = (station: Station) => totalBikes(station) > minimumDepartureBikes;
const isArrivalAvailable = (station: Station) => station.availableSpots >= minimumArrivalSlots;
</script>

<template>
	<AppPage title="Monitor">
		<div class="flex flex-col gap-5">
			<RouterLink
				v-if="!route.query.departure && !route.query.arrival"
				to="/config"
				class="rounded-md bg-success px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-success/70 text-center"
			>
				Configure departure & arrival.
			</RouterLink>

			<section class="grid gap-4 md:grid-cols-2">
				<article
					class="rounded-lg border border-border bg-surface p-4 shadow-card flex flex-col gap-2"
				>
					<header class="mb-3">
						<h2 class="text-lg font-semibold text-text">Departure stations</h2>
						<p class="text-sm text-text-muted">{{ departureStatusLabel }}</p>
					</header>

					<ul v-if="departures.length" class="flex flex-col gap-2">
						<li
							v-for="station in departures"
							:key="station.id"
							class="flex items-start justify-between rounded-md border border-border px-3 py-2"
							:class="
								isDepartureAvailable(station) ? 'bg-success/20 text-green-800' : 'bg-bg text-text'
							"
						>
							<div>
								<p class="text-sm font-medium">{{ station.name }}</p>
								<p class="text-xs">{{ totalBikes(station) }} bikes available</p>
							</div>
							<span class="px-2 py-1 text-xs font-semibold">
								{{ isDepartureAvailable(station) ? 'Available' : 'Unavailable' }}
							</span>
						</li>
					</ul>

					<p v-else class="text-sm text-text-muted">No departure stations selected.</p>

					<div
						v-if="alternativeDeparture"
						class="rounded-md bg-warning/20 p-3 text-sm text-warning mt-auto"
					>
						<span class="mb-2 block text-xs font-semibold uppercase tracking-wide">
							Alternative station:
						</span>
						<div>
							<p class="text-sm font-medium">{{ alternativeDeparture.name }}</p>
							<p class="text-xs">{{ totalBikes(alternativeDeparture) }} bikes available</p>
						</div>
					</div>
				</article>

				<article
					class="rounded-lg border border-border bg-surface p-4 shadow-card flex flex-col gap-2"
				>
					<header class="mb-3">
						<h2 class="text-lg font-semibold text-text">Arrival stations</h2>
						<p class="text-sm text-text-muted">{{ arrivalStatusLabel }}</p>
					</header>

					<ul v-if="arrivals.length" class="flex flex-col gap-2">
						<li
							v-for="station in arrivals"
							:key="station.id"
							class="flex items-start justify-between rounded-md border border-border px-3 py-2"
							:class="
								isArrivalAvailable(station) ? 'bg-success/20 text-green-800' : 'bg-bg text-text'
							"
						>
							<div>
								<p class="text-sm font-medium">{{ station.name }}</p>
								<p class="text-xs">{{ station.availableSpots }} slots available</p>
							</div>
							<span class="px-2 py-1 text-xs font-semibold">
								{{ isArrivalAvailable(station) ? 'Available' : 'Unavailable' }}
							</span>
						</li>
					</ul>

					<p v-else class="text-sm text-text-muted">No arrival stations selected.</p>
					<div
						v-if="alternativeArrival"
						class="rounded-md bg-warning/20 p-3 text-sm text-warning mt-auto"
					>
						<span class="mb-2 block text-xs font-semibold uppercase tracking-wide">
							Alternative station:
						</span>
						<div>
							<p class="text-sm font-medium">{{ alternativeArrival.name }}</p>
							<p class="text-xs">{{ alternativeArrival.availableSpots }} slots available</p>
						</div>
					</div>
				</article>
			</section>

			<a
				v-if="alternativeDirectionsUrl"
				:href="alternativeDirectionsUrl"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-md border border-border bg-surface px-3 py-2 text-center text-sm font-medium text-text transition-colors hover:bg-bg"
			>
				Open shortest path in Google Maps
			</a>

			<LeafletCentroidMap
				:departure-nodes="departureNodes"
				:arrival-nodes="arrivalNodes"
				v-if="isPathPossible"
			/>
		</div>
	</AppPage>
</template>

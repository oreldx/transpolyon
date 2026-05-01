<script setup lang="ts">
import type { LatLngPoint, LatLngTuple } from '@/utils/types';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';

type NodeInput = LatLngTuple | LatLngPoint;

const props = defineProps<{
	departureNodes: NodeInput[];
	arrivalNodes: NodeInput[];
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
const map = shallowRef<L.Map | null>(null);
const drawnLayer = shallowRef<L.LayerGroup | null>(null);

const hasEnoughNodes = computed(
	() => props.departureNodes.length > 0 && props.arrivalNodes.length > 0,
);

const parseNode = (node: NodeInput): LatLngTuple | null => {
	if (Array.isArray(node)) {
		if (node.length !== 2) {
			return null;
		}

		const [lat, lng] = node;
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			return null;
		}

		return [lat, lng];
	}

	if (!Number.isFinite(node.lat) || !Number.isFinite(node.lng)) {
		return null;
	}

	return [node.lat, node.lng];
};

const toPoints = (nodes: NodeInput[]): LatLngTuple[] =>
	nodes.map(parseNode).filter((node): node is LatLngTuple => node !== null);

const departurePoints = computed(() => toPoints(props.departureNodes));
const arrivalPoints = computed(() => toPoints(props.arrivalNodes));

const getCentroid = (points: LatLngTuple[]): LatLngTuple => {
	const [latSum, lngSum] = points.reduce(
		([accLat, accLng], [lat, lng]) => [accLat + lat, accLng + lng],
		[0, 0],
	);

	return [latSum / points.length, lngSum / points.length];
};

const initializeMap = () => {
	if (map.value || !mapContainer.value) {
		return;
	}

	map.value = L.map(mapContainer.value, {
		zoomControl: true,
	}).setView([45.75, 4.85], 13);

	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	}).addTo(map.value);

	drawnLayer.value = L.layerGroup().addTo(map.value);
};

const destroyMap = () => {
	if (!map.value) {
		return;
	}

	map.value.remove();
	map.value = null;
	drawnLayer.value = null;
};

const renderPaths = () => {
	if (!map.value || !drawnLayer.value || !hasEnoughNodes.value) {
		return;
	}

	drawnLayer.value.clearLayers();

	const depCentroid = getCentroid(departurePoints.value);
	const arrCentroid = getCentroid(arrivalPoints.value);

	const allPoints = [...departurePoints.value, ...arrivalPoints.value];

	departurePoints.value.forEach((point) => {
		L.polyline([point, depCentroid], {
			color: '#3498db',
			weight: 3,
			opacity: 1,
		}).addTo(drawnLayer.value!);
	});

	arrivalPoints.value.forEach((point) => {
		L.polyline([point, arrCentroid], {
			color: '#e74c3c',
			weight: 3,
			opacity: 1,
		}).addTo(drawnLayer.value!);
	});

	L.polyline([depCentroid, arrCentroid], {
		color: '#f39c12',
		weight: 4,
	}).addTo(drawnLayer.value);

	departurePoints.value.forEach((point) => {
		L.circleMarker(point, {
			radius: 5,
			color: '#1a1a1a',
			fillColor: '#fafafa',
			fillOpacity: 1,
			weight: 3,
		}).addTo(drawnLayer.value!);
	});

	arrivalPoints.value.forEach((point) => {
		L.circleMarker(point, {
			radius: 5,
			color: '#1a1a1a',
			fillColor: '#fafafa',
			fillOpacity: 1,
			weight: 3,
		}).addTo(drawnLayer.value!);
	});

	L.polygon(
		[
			[depCentroid[0] + 0.0005, depCentroid[1]],
			[depCentroid[0], depCentroid[1] + 0.0005],
			[depCentroid[0] - 0.0005, depCentroid[1]],
			[depCentroid[0], depCentroid[1] - 0.0005],
		],
		{
			color: '#1a1a1a',
			fillColor: '#fafafa',
			fillOpacity: 1,
			weight: 2,
		},
	).addTo(drawnLayer.value);

	L.polygon(
		[
			[arrCentroid[0] + 0.0005, arrCentroid[1]],
			[arrCentroid[0], arrCentroid[1] + 0.0005],
			[arrCentroid[0] - 0.0005, arrCentroid[1]],
			[arrCentroid[0], arrCentroid[1] - 0.0005],
		],
		{
			color: '#1a1a1a',
			fillColor: '#fafafa',
			fillOpacity: 1,
			weight: 2,
		},
	).addTo(drawnLayer.value);

	const bounds = L.latLngBounds(allPoints);
	map.value.fitBounds(bounds, {
		padding: [24, 24],
		maxZoom: 15,
	});
};

watch(
	hasEnoughNodes,
	async (enabled) => {
		if (!enabled) {
			destroyMap();
			return;
		}

		await nextTick();
		initializeMap();
		renderPaths();
		map.value?.invalidateSize();
	},
	{ immediate: true },
);

watch(
	[departurePoints, arrivalPoints],
	async () => {
		if (!hasEnoughNodes.value) {
			return;
		}

		await nextTick();
		initializeMap();
		renderPaths();
	},
	{ deep: true },
);

onBeforeUnmount(() => {
	destroyMap();
});
</script>

<template>
	<section class="rounded-lg border border-border bg-surface p-4 shadow-card">
		<header class="mb-3 flex items-center justify-between">
			<h3 class="text-sm font-semibold uppercase tracking-wide text-text-muted">
				Departure to arrival flow
			</h3>
		</header>

		<div
			v-if="hasEnoughNodes"
			ref="mapContainer"
			class="h-90 w-full rounded-md border border-border"
		/>

		<p
			v-else
			class="rounded-md border border-dashed border-border bg-bg px-3 py-6 text-center text-sm text-text-muted"
		>
			Select at least 1 departure and 1 arrival stations to display the map.
		</p>
	</section>
</template>

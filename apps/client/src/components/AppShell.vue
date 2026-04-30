<script setup lang="ts">
import Config from '@/views/Config.vue';
import Map from '@/views/Map.vue';
import Monitor from '@/views/Monitor.vue';
import { computed, ref } from 'vue';

const routes: Record<string, typeof Map> = {
	map: Map,
	config: Config,
	monitor: Monitor,
};

const currentRoute = computed(() => {
	const path = window.location.pathname.split('/')[1] || 'map';
	return routes[path] || Map;
});

const isNavOpen = ref(false);

const navItems = [
	{ label: 'Map', id: 'map', href: '/map' },
	{ label: 'Monitor', id: 'monitor', href: '/monitor' },
	{ label: 'Config', id: 'config', href: '/config' },
];

const activeNav = ref(window.location.pathname.split('/')[1] || 'map');

const toggleNav = () => {
	isNavOpen.value = !isNavOpen.value;
};

const selectNav = (id: string) => {
	activeNav.value = id;
	isNavOpen.value = false;
};
</script>

<template>
	<div
		class="grid h-screen grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[240px_1fr] md:grid-rows-1"
	>
		<!-- Desktop Sidebar Navigation -->
		<nav class="hidden md:flex md:flex-col bg-surface border-r border-border px-4 py-6 gap-8">
			<div class="flex items-center gap-2">
				<img src="/assets/logo.png" alt="Logo" class="w-8 mb-2" />
				<h1 class="text-lg font-black text-text">Transpolyon</h1>
			</div>
			<ul class="flex flex-col gap-1 list-none m-0 p-0">
				<li v-for="item in navItems" :key="item.id">
					<a
						class="block w-full text-left px-4 py-3 text-sm font-medium text-text-muted rounded-md transition-all hover:bg-bg hover:text-text"
						:class="{ ' text-text font-semibold border-2 border-border': activeNav === item.id }"
						@click="selectNav(item.id)"
						:href="item.href"
					>
						{{ item.label }}
					</a>
				</li>
			</ul>
		</nav>

		<!-- Mobile Header with Burger -->
		<header
			class="md:hidden flex items-center justify-between px-4 py-4 bg-surface border-b border-border"
		>
			<div class="flex items-center gap-2">
				<img src="/assets/logo.png" alt="Logo" class="w-8 mb-2" />
				<h1 class="text-lg font-bold text-text">Transpolyon</h1>
			</div>
			<button
				class="flex flex-col gap-1.5 p-2 -m-2"
				@click="toggleNav"
				:aria-label="isNavOpen ? 'Close menu' : 'Open menu'"
			>
				<span class="block w-6 h-0.5 bg-text rounded-sm transition-all"></span>
				<span class="block w-6 h-0.5 bg-text rounded-sm transition-all"></span>
				<span class="block w-6 h-0.5 bg-text rounded-sm transition-all"></span>
			</button>
		</header>

		<!-- Mobile Navigation Overlay -->
		<nav
			v-show="isNavOpen"
			class="md:hidden absolute top-14 left-0 right-0 bg-surface border-b border-border z-10 max-h-[calc(100vh-56px)] overflow-y-auto"
		>
			<ul class="flex flex-col gap-1 list-none m-0 p-2">
				<li v-for="item in navItems" :key="item.id">
					<a
						class="block w-full text-left px-4 py-3 text-sm font-medium text-text-muted rounded-md transition-all hover:bg-bg hover:text-text"
						:class="{ 'bg-bg text-text font-semibold': activeNav === item.id }"
						@click="selectNav(item.id)"
						:href="item.href"
					>
						{{ item.label }}
					</a>
				</li>
			</ul>
		</nav>

		<!-- Main Content Area -->
		<main class="overflow-auto bg-bg">
			<component :is="currentRoute" />
		</main>
	</div>
</template>

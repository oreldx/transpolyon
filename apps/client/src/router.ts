import { createRouter, createWebHistory } from 'vue-router';

import Config from '@/views/Config.vue';
import Map from '@/views/Map.vue';
import Monitor from '@/views/Monitor.vue';

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', redirect: '/map' },
		{ path: '/map', component: Map },
		{ path: '/monitor', component: Monitor },
		{ path: '/config', component: Config },
		{ path: '/:pathMatch(.*)*', redirect: '/map' },
	],
});

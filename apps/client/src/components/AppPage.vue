<script setup lang="ts">
defineProps<{
	title: string;
}>();
</script>

<template>
	<section class="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
		<header class="mb-6 border-b border-border pb-3">
			<h1 class="text-2xl font-bold tracking-tight text-text md:text-3xl">{{ title }}</h1>
		</header>

		<div class="space-y-4">
			<slot />
		</div>
	</section>
</template>

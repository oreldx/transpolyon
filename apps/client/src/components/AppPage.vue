<script setup lang="ts">
defineProps<{
	title: string;
}>();
</script>

<template>
	<section class="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6">
		<header class="border-b border-border pb-3">
			<h1 class="text-2xl font-bold tracking-tight text-text md:text-3xl">{{ title }}</h1>
		</header>

		<div>
			<slot />
		</div>
	</section>
</template>

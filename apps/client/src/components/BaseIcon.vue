<script setup lang="ts">
const props = defineProps<{
	iconName: string;
	width: number | string;
	height: number | string;
	iconColor: string;
}>();
</script>

<template>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		:width="width"
		:height="height"
		viewBox="0 0 24 24"
		:aria-labelledby="iconName"
		role="presentation"
		class="inline-block align-baseline -mb-0.5"
	>
		<title :id="iconName" lang="en">{{ iconName }} icon</title>
		<g :fill="iconColor">
			<slot />
		</g>
	</svg>
</template>

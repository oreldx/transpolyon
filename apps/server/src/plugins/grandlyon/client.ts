import type { FastifyInstance } from 'fastify';
import config from './config.ts';

export const createGrandLyonClient = (fastify: FastifyInstance) => {
	return {
		async fetch<TResponse = unknown>(
			endpoint: string,
			params?: Record<string, string>,
		): Promise<TResponse> {
			const url = new URL(config.baseUrl + endpoint);

			for (const [key, value] of Object.entries(params ?? {})) {
				url.searchParams.append(key, value);
			}

			const user = process.env.GRANDLYON_USERNAME;
			const pass = process.env.GRANDLYON_PASSWORD;

			let headers = new Headers();
			headers.set('Authorization', 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64'));

			const response = await fetch(url, {
				headers,
			});

			if (!response.ok) {
				throw new Error(`Grand Lyon API error: ${response.status} ${response.statusText}`);
			}

			return (await response.json()) as TResponse;
		},
	};
};

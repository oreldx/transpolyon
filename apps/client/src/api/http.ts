const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

export async function apiFetch<T>(
	path: string,
	options?: RequestInit,
	baseUrl: string = API_BASE_URL,
): Promise<T> {
	const response = await fetch(`${baseUrl}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			...options?.headers,
		},
		...options,
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status}`);
	}

	return response.json();
}

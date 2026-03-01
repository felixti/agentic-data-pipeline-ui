import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

const TIMEOUT_MS = 180_000; // 180 seconds — needed for large file uploads

const authMiddleware: Middleware = {
	async onRequest({ request }) {
		if (typeof window !== "undefined") {
			const apiKey = localStorage.getItem("ag_api_key");
			if (apiKey) {
				request.headers.set("X-API-Key", apiKey);
			}
		}
		return request;
	},
};

const timeoutMiddleware: Middleware = {
	async onRequest({ request }) {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), TIMEOUT_MS);
		return new Request(request, { signal: controller.signal });
	},
};

export const apiClient = createClient<paths>({
	baseUrl:
		typeof window !== "undefined"
			? "/proxy"
			: process.env.NEXT_PUBLIC_API_URL ||
				"https://pipeline-api.felixtek.cloud",
});

apiClient.use(authMiddleware);
apiClient.use(timeoutMiddleware);

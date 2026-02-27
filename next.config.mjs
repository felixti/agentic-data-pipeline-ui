/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	experimental: {
		proxyClientMaxBodySize: "30mb",
	},
	async rewrites() {
		const apiUrl =
			process.env.NEXT_PUBLIC_API_URL ||
			"https://pipeline-api.felixtek.cloud";
		return [
			{
				source: "/proxy/api/:path*",
				destination: `${apiUrl}/api/:path*`,
			},
			{
				source: "/proxy/health/:path*",
				destination: `${apiUrl}/health/:path*`,
			},
			{
				source: "/proxy/health",
				destination: `${apiUrl}/health`,
			},
			{
				source: "/proxy/metrics",
				destination: `${apiUrl}/metrics`,
			},
		];
	},
};

export default nextConfig;

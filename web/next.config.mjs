/** @type {import('next').NextConfig} */
const staticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(staticDemo ? { output: "export", trailingSlash: true } : {}),
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    "@fortifykitchen/config",
    "@fortifykitchen/shared",
    "@fortifykitchen/types",
    "@fortifykitchen/ui",
    "@fortifykitchen/utils"
  ]
};

export default nextConfig;

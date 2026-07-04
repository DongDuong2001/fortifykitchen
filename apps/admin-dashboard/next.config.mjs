/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@fortifykitchen/config",
    "@fortifykitchen/shared",
    "@fortifykitchen/types",
    "@fortifykitchen/ui",
    "@fortifykitchen/utils"
  ]
};

export default nextConfig;

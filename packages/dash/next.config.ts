import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    transpilePackages: ["@il4mb/rce"],
    typescript: {
        ignoreBuildErrors: true
    }
}

export default nextConfig

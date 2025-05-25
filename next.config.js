/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Ensure Next.js handles routing properly
    compiler: {
        styledComponents: true,
    },
    images: {
        domains: ['images.unsplash.com', 'avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    },
    env: {
        ML_API_URL: process.env.ML_API_URL || 'http://localhost:8000',
    },
    // Disable ESLint during production build
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Disable TypeScript type checking during builds
    typescript: {
        ignoreBuildErrors: true,
    },
}

module.exports = nextConfig 
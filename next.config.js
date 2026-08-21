/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "tinacms",
    "tinacms-authjs",
    "@tinacms/datalayer",
    "tinacms-gitprovider-github",
  ],
  async rewrites() {
    return [
      {
        source: "/admin",
        destination: "/admin/index.html",
      },
    ];
  },
};

module.exports = nextConfig;

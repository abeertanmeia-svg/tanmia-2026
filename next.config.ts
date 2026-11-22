import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/assistant", destination: "/dashboard/assistant", permanent: false },
      { source: "/forms", destination: "/dashboard/forms", permanent: false },
      { source: "/forms/:type", destination: "/dashboard/forms/:type", permanent: false },
      { source: "/admin", destination: "/dashboard/manage", permanent: false },
    ];
  },
};

export default nextConfig;

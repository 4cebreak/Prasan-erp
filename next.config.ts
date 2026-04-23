import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "jspdf",
    "@prisma/client",
    ".prisma/client",
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],
  allowedDevOrigins: ["192.168.70.138"],
};

export default nextConfig;

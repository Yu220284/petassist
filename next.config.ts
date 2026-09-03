import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  ...(process.env.ELECTRON_DIST === "1" ? { output: "standalone" as const } : {}),
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["pdfkit", "pptxgenjs", "jimp", "qrcode"],
  devIndicators: false,
};

export default nextConfig;

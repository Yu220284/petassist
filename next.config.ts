import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["pdfkit", "pptxgenjs", "jimp", "qrcode"],
  devIndicators: false,
};

export default nextConfig;

// Static export only: no server, no API routes (ADR-001). Output goes to web/out/.
/** @type {import('next').NextConfig} */
export default {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

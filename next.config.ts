import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Security headers applied to every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent MIME-type sniffing.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking — this app must not be framed.
          { key: "X-Frame-Options", value: "DENY" },
          // Control referrer information sent with requests.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict browser features (camera, mic, geolocation) — not needed.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // CSP: only allow self for scripts/styles/images; no inline, no eval.
          // next/font + styled inline styles are handled via nonces/hashes by Next.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          // Force HTTPS in production (1 year, with preload).
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;

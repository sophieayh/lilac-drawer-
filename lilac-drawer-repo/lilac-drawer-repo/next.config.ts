import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents MIME-sniffing a response away from its declared Content-Type —
  // blocks a class of attacks where a browser is tricked into executing an
  // uploaded/served file as script/HTML.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No page on this site should ever be framed by another site (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Send the referrer to same-origin requests and to cross-origin ones only
  // the origin (not the full path/query) — avoids leaking, e.g., a signed-in
  // page's URL to third-party image/link destinations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Explicitly deny access to browser features this site never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS: once a browser has loaded this site over HTTPS once, force HTTPS
  // for the next year, including subdomains. Harmless in local HTTP dev —
  // browsers ignore this header on non-HTTPS responses.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Removes the `X-Powered-By: Next.js` response header — no reason to hand
  // an attacker the framework/version for free.
  poweredByHeader: false,
  images: {
    // Real product/article photos are uploaded from the admin dashboard to
    // Vercel Blob (see lilac-drawer-admin's /api/upload) and referenced by
    // `imageUrl` — next/image needs the storage domain allow-listed to
    // optimize them. Every store's public hostname matches this pattern.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

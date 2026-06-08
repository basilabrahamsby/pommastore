const isServer = typeof window === 'undefined';
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = !isServer && window.location.hostname === 'localhost';

// In production, static uploads are served under /kozmocart/static_uploads/ via Nginx
// Matching BACKEND_URL on server (SSR) and client prevents hydration mismatches
const BACKEND_URL = isProduction
  ? '/kozmocart'
  : (isLocalhost || isServer)
    ? 'http://localhost:8000'
    : '/kozmocart';

export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '/kozmocart/placeholder-perfume.png';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;

  // Ensure the path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Storefront local public assets (Next.js public folder, served under /kozmocart basePath)
  const isStorefrontAsset = cleanPath === '/logo.png' ||
                            cleanPath === '/placeholder-perfume.png' ||
                            cleanPath.startsWith('/hero-') ||
                            cleanPath.startsWith('/arch-') ||
                            cleanPath.startsWith('/banner-');

  if (isStorefrontAsset) {
    return `/kozmocart${cleanPath}`;
  }

  return `${BACKEND_URL}${cleanPath}`;
};


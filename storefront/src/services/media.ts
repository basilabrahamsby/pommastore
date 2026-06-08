const isServer = typeof window === 'undefined';
const isLocalhost = !isServer && window.location.hostname === 'localhost';

// In production, static uploads are served under /kozmocart/static_uploads/ via Nginx
const BACKEND_URL = isServer
  ? ''
  : isLocalhost
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

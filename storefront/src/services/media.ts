const isServer = typeof window === 'undefined';
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = !isServer && window.location.hostname === 'localhost';

// In production, static uploads are served under /static_uploads/ via Nginx at root level
const BACKEND_URL = isProduction
  ? ''
  : (isLocalhost || isServer)
    ? 'http://localhost:8000'
    : '';

export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '/placeholder-perfume.png';
  
  // Strip /kozmocart prefix if present in database path values
  let cleanPath = path.replace(/^\/kozmocart/, '');
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('data:')) return cleanPath;

  // Ensure the path starts with /
  cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  return `${BACKEND_URL}${cleanPath}`;
};


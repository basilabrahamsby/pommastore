const isServer = typeof window === 'undefined';

// Use runtime hostname detection (not NODE_ENV) so Docker production builds
// work on localhost. On live server, nginx proxies /static_uploads/ so no prefix needed.
const getBackendUrl = (): string => {
  if (isServer) return 'http://api:8000';
  if (window.location.hostname === 'localhost') return 'http://localhost:8030';
  return ''; // live server: nginx handles /static_uploads/ at root
};

const BACKEND_URL = getBackendUrl();

export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '/placeholder-perfume.png';
  
  // Strip /pommastore prefix if present in database path values
  let cleanPath = path.replace(/^\/pommastore/, '');
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('data:')) return cleanPath;

  // Ensure the path starts with /
  cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  return `${BACKEND_URL}${cleanPath}`;
};


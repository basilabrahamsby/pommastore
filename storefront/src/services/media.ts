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
  if (!path) return '/pommastore/placeholder-perfume.png';
  
  let cleanPath = path;
  
  // Extract relative /static_uploads/ path if embedded with localhost/remote URL
  if (cleanPath.includes('/static_uploads/')) {
    const idx = cleanPath.indexOf('/static_uploads/');
    cleanPath = cleanPath.substring(idx);
  } else if (cleanPath.startsWith('http') || cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  const prefix = isServer 
    ? 'http://api:8000' 
    : (window.location.hostname === 'localhost' ? 'http://localhost:8030' : '/pommastore');

  return `${prefix}${cleanPath}`;
};


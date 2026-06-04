const BACKEND_URL = typeof window === 'undefined' ? 'http://api:8000' : (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');

export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '/placeholder-perfume.png';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path; // Handle base64 if still present
  
  // Ensure the path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};

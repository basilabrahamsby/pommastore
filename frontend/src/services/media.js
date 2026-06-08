const BACKEND_URL = import.meta.env.VITE_STATIC_BASE_URL ?? (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path; 
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};

const BACKEND_URL = import.meta.env.VITE_STATIC_BASE_URL || '';

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:')) return path;

  if (BACKEND_URL) {
    const base = BACKEND_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }

  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Extract subpath from Vite BASE_URL (e.g. '/pommastore/admin/' -> '/pommastore')
  const rawBase = import.meta.env.BASE_URL || '';
  const subpath = rawBase.replace(/\/admin\/?$/, '').replace(/\/$/, '');

  if (subpath && !cleanPath.startsWith(subpath)) {
    cleanPath = `${subpath}${cleanPath}`;
  }

  return cleanPath;
};

const BACKEND_URL = typeof window === 'undefined' ? '' : (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');

export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '/kozmocart/placeholder-perfume.png';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path; // Handle base64 if still present
  
  // Ensure the path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Storefront local public assets should be prefix-routed under Next.js basePath
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

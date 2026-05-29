const fallbackApiUrl = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://market-back-iota.vercel.app';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || fallbackApiUrl).replace(/\/$/, '');

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

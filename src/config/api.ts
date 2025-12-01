// Konfiguriere die API-URL basierend auf der Umgebung
// In Development (localhost) nutzen wir localhost:3001
// In Production nutzen wir die aktuelle Domain mit /api
const isDevelopment = import.meta.env.DEV;

// Für Production: Verwende die aktuelle Domain
// Für Development: Verwende localhost mit konfigurierbarem Port
const getApiBaseUrl = () => {
  if (isDevelopment) {
    const API_PORT = import.meta.env.VITE_API_PORT || 3001;
    const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
    return `http://${API_HOST}:${API_PORT}/api`;
  }
  
  // Production: Prüfe ob wir auf localhost sind (für npm run server)
  const currentOrigin = window.location.origin;
  const isLocalhost = currentOrigin.includes('localhost') || 
                      currentOrigin.includes('127.0.0.1') ||
                      currentOrigin.startsWith('file://');
  
  // Wenn localhost, verwende explizit localhost:3001
  if (isLocalhost) {
    return 'http://localhost:3001/api';
  }
  
  // Ansonsten nutze die aktuelle Domain (echter Production-Server)
  return `${currentOrigin}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

console.log('API Configuration:', {
  isDevelopment,
  API_BASE_URL,
  mode: import.meta.env.MODE,
  origin: typeof window !== 'undefined' ? window.location.origin : 'SSR'
});

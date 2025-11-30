// Konfiguriere die API-URL basierend auf der Umgebung
const API_PORT = import.meta.env.VITE_API_PORT || 3002;
const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

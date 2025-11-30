// Konfiguriere die API-URL basierend auf der Umgebung
// In Production (gebaut) nutzen wir relative URLs, da Frontend und Backend auf gleichem Server laufen
// In Development nutzen wir localhost:3002
const isDevelopment = import.meta.env.DEV;
const API_PORT = import.meta.env.VITE_API_PORT || 3002;
const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';

export const API_BASE_URL = isDevelopment 
  ? `http://${API_HOST}:${API_PORT}/api`
  : '/api'; // Production: Relative URL, da alles auf gleichem Port läuft

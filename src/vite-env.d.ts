/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Adresse de l'API (vite.config.ts) : vide en développement (proxy), Render sur le site publié
  readonly VITE_API_URL: string;
}

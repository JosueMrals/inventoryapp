interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Agrega aquí otras variables de entorno que uses
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
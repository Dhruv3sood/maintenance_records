/// <reference types="vite/client" />

declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

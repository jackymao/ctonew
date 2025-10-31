/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Error {
      message: string;
    }
    interface Locals {}
    interface PageData {}
    interface Platform {}
  }

  interface ImportMetaEnv {
    readonly VITE_PB_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};

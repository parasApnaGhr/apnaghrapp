/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cashfree SDK loaded via <script> tag
declare interface Window {
  Cashfree: (options: { mode: string }) => {
    checkout: (options: { paymentSessionId: string; redirectTarget?: string }) => Promise<unknown>;
  };
}

/// <reference types="vite/client" />

// Polyfill NodeJS namespace for browser-only TypeScript
declare namespace NodeJS {
  type Timeout = ReturnType<typeof globalThis.setTimeout>;
  type Timer = Timeout;
}

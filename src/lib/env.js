// Single place that reads the build mode, so tests and non-Vite tooling can import safely.
// Vite replaces import.meta.env.DEV statically; outside Vite it is undefined and this is false.
export const IS_DEV = Boolean(import.meta.env && import.meta.env.DEV);

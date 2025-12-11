// Disable console.log in production
export function disableConsoleInProduction() {
  // Check if running in production (Vite sets this)
  if (import.meta.env.PROD) {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    // Keep console.error and console.warn for critical issues
  }
}

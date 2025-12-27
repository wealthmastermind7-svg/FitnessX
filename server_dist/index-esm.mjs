// CommonJS wrapper for ESM server module
const { fileURLToPath } = require('url');
const { dirname } = require('path');

// Load and execute the ESM module
(async () => {
  try {
    await import('./index-esm.mjs');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

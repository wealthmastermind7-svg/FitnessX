const { createRequire } = require('module');
const path = require('path');

// Dynamically import the ESM module
(async () => {
  const esmModule = await import('./index.js');
})().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

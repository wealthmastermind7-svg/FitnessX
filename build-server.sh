#!/bin/bash
set -e

echo "Building server with esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=server_dist

echo "Creating CommonJS wrapper for server_dist..."

# Create a CommonJS wrapper that loads the ESM module
cat > server_dist/index.cjs << 'WRAPPER'
const { createRequire } = require('module');
const path = require('path');

// Dynamically import the ESM module
(async () => {
  const esmModule = await import('./index.js');
})().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
WRAPPER

# Create a simple CommonJS entry that can be required
cat > server_dist/wrapper.js << 'WRAPPER2'
const path = require('path');
const { spawn } = require('child_process');

// Spawn a Node process to run the ESM server
const child = spawn('node', [path.join(__dirname, 'index.js')], {
  stdio: 'inherit',
  env: process.env
});

process.on('exit', () => {
  child.kill();
});

child.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
WRAPPER2

echo "Server build complete!"

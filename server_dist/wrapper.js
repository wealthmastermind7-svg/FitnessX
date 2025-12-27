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

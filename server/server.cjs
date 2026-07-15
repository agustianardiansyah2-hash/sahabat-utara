// CommonJS wrapper for ES Module server
// This file is required by LiteSpeed's lsnode.js which uses CommonJS

const { spawn } = require('child_process');
const path = require('path');

// Get the directory of this file
const serverDir = __dirname;

// Start the ESM server
const serverPath = path.join(serverDir, 'index.js');
const nodePath = process.execPath;

const server = spawn(nodePath, [serverPath], {
  cwd: serverDir,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env }
});

// Forward stdout/stderr
server.stdout.on('data', (data) => {
  process.stdout.write(data);
});

server.stderr.on('data', (data) => {
  process.stderr.write(data);
});

server.on('close', (code) => {
  process.exit(code);
});

// Handle signals
process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
});

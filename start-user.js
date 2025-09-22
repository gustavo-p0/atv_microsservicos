const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando User Service...');
const userService = spawn('npx', ['ts-node', 'services/user-service/server.ts'], {
  stdio: 'inherit',
  cwd: __dirname
});

userService.on('close', (code) => {
  console.log(`User Service encerrado com código ${code}`);
});

process.on('SIGINT', () => {
  userService.kill('SIGINT');
  process.exit(0);
});

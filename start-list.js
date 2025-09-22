const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando List Service...');
const listService = spawn('npx', ['ts-node', 'services/list-service/server.ts'], {
  stdio: 'inherit',
  cwd: __dirname
});

listService.on('close', (code) => {
  console.log(`List Service encerrado com código ${code}`);
});

process.on('SIGINT', () => {
  listService.kill('SIGINT');
  process.exit(0);
});

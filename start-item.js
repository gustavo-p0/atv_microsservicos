const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Item Service...');
const itemService = spawn('npx', ['ts-node', 'services/item-service/server.ts'], {
  stdio: 'inherit',
  cwd: __dirname
});

itemService.on('close', (code) => {
  console.log(`Item Service encerrado com código ${code}`);
});

process.on('SIGINT', () => {
  itemService.kill('SIGINT');
  process.exit(0);
});

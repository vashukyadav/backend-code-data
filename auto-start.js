const { exec } = require('child_process');
const net = require('net');

const isWin = process.platform === 'win32';

function checkPort(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

function killPort(port) {
  return new Promise(resolve => {
    const cmd = isWin 
      ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`
      : `lsof -ti:${port} | xargs kill -9`;
    
    exec(cmd, () => resolve());
  });
}

async function findPort(start = 5000) {
  for (let port = start; port < start + 10; port++) {
    if (await checkPort(port)) return port;
  }
  return null;
}

async function start() {
  let port = 5000;
  
  if (!(await checkPort(port))) {
    console.log(`Port ${port} busy, killing process...`);
    await killPort(port);
    await new Promise(r => setTimeout(r, 1000));
    
    if (!(await checkPort(port))) {
      port = await findPort(5001);
      console.log(`Using alternate port: ${port}`);
    }
  }
  
  process.env.PORT = port;
  require('./server.js');
}

start();
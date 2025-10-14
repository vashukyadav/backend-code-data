const { exec } = require('child_process');
const net = require('net');

const isWindows = process.platform === 'win32';

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Kill process on port (cross-platform)
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const command = isWindows 
      ? `netstat -ano | findstr :${port} && for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`
      : `lsof -ti:${port} | xargs kill -9`;
    
    exec(command, (error) => {
      if (error) {
        console.log(`⚠️  No process found on port ${port} or failed to kill`);
      } else {
        console.log(`✅ Process on port ${port} terminated`);
      }
      resolve();
    });
  });
}

// Find available port starting from basePort
async function findAvailablePort(basePort = 5000) {
  for (let port = basePort; port <= basePort + 10; port++) {
    if (await checkPort(port)) {
      return port;
    }
  }
  throw new Error('No available ports found');
}

// Start server with smart port handling
async function startServer() {
  try {
    const desiredPort = process.env.PORT || 5000;
    
    console.log(`🔍 Checking port ${desiredPort}...`);
    
    // Check if desired port is available
    const isAvailable = await checkPort(desiredPort);
    
    if (!isAvailable) {
      console.log(`⚠️  Port ${desiredPort} is busy. Attempting to free it...`);
      await killProcessOnPort(desiredPort);
      
      // Wait a moment for port to be freed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check again
      const isNowAvailable = await checkPort(desiredPort);
      
      if (isNowAvailable) {
        console.log(`✅ Port ${desiredPort} is now available`);
        process.env.PORT = desiredPort;
      } else {
        console.log(`❌ Port ${desiredPort} still busy. Finding alternative...`);
        const availablePort = await findAvailablePort(parseInt(desiredPort) + 1);
        console.log(`✅ Using port ${availablePort} instead`);
        process.env.PORT = availablePort;
      }
    } else {
      console.log(`✅ Port ${desiredPort} is available`);
    }
    
    // Start the actual server
    console.log(`🚀 Starting server on port ${process.env.PORT}...`);
    require('./server.js');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
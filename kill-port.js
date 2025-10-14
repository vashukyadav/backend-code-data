const { exec } = require('child_process');

const port = process.argv[2] || 5000;
const isWindows = process.platform === 'win32';

console.log(`🔍 Checking for processes on port ${port}...`);

const command = isWindows 
  ? `netstat -ano | findstr :${port}`
  : `lsof -ti:${port}`;

exec(command, (error, stdout) => {
  if (error || !stdout.trim()) {
    console.log(`✅ No process found on port ${port}`);
    return;
  }

  console.log(`⚠️  Found process on port ${port}`);
  
  const killCommand = isWindows
    ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`
    : `lsof -ti:${port} | xargs kill -9`;

  exec(killCommand, (killError) => {
    if (killError) {
      console.error(`❌ Failed to kill process: ${killError.message}`);
    } else {
      console.log(`✅ Process on port ${port} terminated successfully`);
    }
  });
});
# 🚀 Port Management Guide

## Quick Start Commands

### 🎯 Recommended (Automatic Port Handling)
```bash
npm start
# या
node start-server.js
```

### 🔧 Manual Commands

#### Port को manually kill करने के लिए:
```bash
# Default port 5000
npm run kill-port

# Specific port
node kill-port.js 3000
```

#### Direct server start (no port handling):
```bash
npm run server
# या  
node server.js
```

## 🖥️ Platform Specific Commands

### Windows
```cmd
# Check port usage
netstat -ano | findstr :5000

# Kill specific PID
taskkill /PID <PID_NUMBER> /F

# Kill all processes on port 5000
for /f "tokens=5" %a in ('netstat -ano ^| findstr :5000') do taskkill /PID %a /F
```

### Mac/Linux
```bash
# Check port usage
lsof -i :5000

# Kill processes on port
lsof -ti:5000 | xargs kill -9

# Alternative
sudo kill -9 $(lsof -ti:5000)
```

## 🔄 How It Works

1. **start-server.js** automatically:
   - Checks if desired port is available
   - Kills existing process if found
   - Finds alternative port if needed (5001, 5002...)
   - Starts server gracefully

2. **server.js** includes:
   - Better error handling
   - Graceful shutdown
   - Helpful error messages

## 🚨 Troubleshooting

### Error: EADDRINUSE
```bash
# Solution 1: Use smart starter
npm start

# Solution 2: Kill port manually
npm run kill-port

# Solution 3: Use different port
PORT=3001 npm start
```

### Permission Denied (Mac/Linux)
```bash
sudo npm start
# या
sudo node start-server.js
```

## 📝 Environment Variables

Create `.env` file:
```env
PORT=5000
MONGO_URI=your_mongo_connection
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```
# ARC Gaming Platform - Auto-Restart System

## Overview

The ARC Gaming Platform now includes a comprehensive auto-restart system that ensures both backend and frontend services remain operational even when they crash or lose connection. This system provides automatic recovery, health monitoring, and graceful restart capabilities.

## Features

### 🔄 Auto-Restart Capabilities
- **Backend Auto-Restart**: Automatically restarts the backend server if it crashes
- **Frontend Auto-Restart**: Automatically restarts the frontend if it becomes unresponsive
- **Connection Recovery**: Frontend automatically reconnects when backend is restored
- **Health Monitoring**: Continuous health checks for both services
- **Graceful Shutdown**: Proper cleanup when stopping services

### 📊 Monitoring Features
- **Real-time Status**: Live monitoring of server health
- **Logging**: Comprehensive logging of all restart events
- **Port Conflict Resolution**: Automatically resolves port conflicts
- **Process Management**: Proper process lifecycle management

## How It Works

### Backend Monitoring (`backend/monitor-server.js`)

The enhanced backend monitor provides:

1. **Server Process Management**
   - Spawns and monitors the main server process
   - Detects crashes and unexpected exits
   - Automatically restarts with configurable delays

2. **Health Checks**
   - Periodic health checks via HTTP requests
   - Monitors `/api/health` endpoint
   - Detects unresponsive servers

3. **Frontend Management**
   - Starts and monitors the frontend React app
   - Restarts frontend if it becomes unresponsive
   - Coordinates backend-frontend restart sequence

4. **Configuration**
   ```javascript
   maxRestarts: 10,           // Maximum backend restart attempts
   maxFrontendRestarts: 5,    // Maximum frontend restart attempts
   restartDelay: 5000,        // Backend restart delay (5 seconds)
   frontendRestartDelay: 3000 // Frontend restart delay (3 seconds)
   ```

### Frontend Auto-Restart (`frontend/src/components/ConnectionStatus.tsx`)

The enhanced frontend connection status provides:

1. **Connection Monitoring**
   - Real-time socket connection status
   - Automatic detection of connection loss
   - Visual indicators for connection state

2. **Auto-Restart Logic**
   - 30-second countdown before auto-restart
   - Maximum 3 auto-restart attempts
   - Manual restart option available

3. **User Experience**
   - Clear visual notifications
   - Countdown timer display
   - Manual override options

## Usage

### Starting the System

#### Option 1: Using the PowerShell Script (Recommended)
```powershell
# Start both backend and frontend with auto-restart
.\start-servers.ps1

# Start enhanced monitor only
.\start-servers.ps1 -MonitorOnly

# Start backend only
.\start-servers.ps1 -BackendOnly

# Start frontend only
.\start-servers.ps1 -FrontendOnly
```

#### Option 2: Using the Batch File
```cmd
# Start both servers (calls PowerShell script)
start-servers.bat

# With parameters
start-servers.bat -MonitorOnly
```

#### Option 3: Manual Start
```bash
# Start backend monitor
cd backend
node monitor-server.js

# Start frontend (in another terminal)
cd frontend
npm start
```

### Monitoring and Control

#### Real-time Status
The system provides real-time status information:
- Backend status: Running/Stopped
- Frontend status: Running/Stopped
- Connection status: Connected/Disconnected
- Restart attempts counter

#### Logs
All restart events are logged to:
- Console output (real-time)
- `backend/server-crashes.log` (persistent)

#### Manual Control
- **Manual Restart**: Click "Retry" button in connection status
- **Stop All**: Press Ctrl+C in the PowerShell script
- **Individual Control**: Use specific flags for backend/frontend only

## Configuration

### Backend Monitor Configuration

Edit `backend/monitor-server.js` to modify:

```javascript
class ServerMonitor {
  constructor() {
    this.maxRestarts = 10;              // Max backend restarts
    this.maxFrontendRestarts = 5;       // Max frontend restarts
    this.restartDelay = 5000;           // Backend restart delay (ms)
    this.frontendRestartDelay = 3000;   // Frontend restart delay (ms)
    this.backendPort = 5000;            // Backend port
    this.frontendPort = 3000;           // Frontend port
  }
}
```

### Frontend Auto-Restart Configuration

Edit `frontend/src/components/ConnectionStatus.tsx` to modify:

```typescript
// Auto-restart configuration
const AUTO_RESTART_DELAY = 30000; // 30 seconds
const MAX_AUTO_RESTARTS = 3;      // Max restart attempts
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
**Problem**: Port 3000 or 5000 is already occupied
**Solution**: The system automatically detects and resolves port conflicts

#### 2. Frontend Not Starting
**Problem**: Frontend fails to start after backend restart
**Solution**: Check frontend logs and ensure all dependencies are installed

#### 3. Connection Loss
**Problem**: Frontend shows "Server connection lost"
**Solution**: 
- Wait for auto-restart (30 seconds)
- Click "Retry" button for immediate restart
- Check backend logs for errors

#### 4. Maximum Restarts Reached
**Problem**: System stops restarting after max attempts
**Solution**: 
- Check logs for underlying issues
- Restart the monitor manually
- Investigate root cause of crashes

### Debugging

#### Enable Debug Logging
Add debug logging to see detailed information:

```javascript
// In monitor-server.js
this.log(`🔍 Debug: ${message}`);
```

#### Check Health Endpoints
Manually test health endpoints:
- Backend: `http://localhost:5000/api/health`
- Frontend: `http://localhost:3000/`

#### Monitor Process List
Check running processes:
```powershell
Get-Process -Name "node" | Select-Object Id, ProcessName, CommandLine
```

## Best Practices

### 1. Development Environment
- Use `-MonitorOnly` flag during development
- Monitor logs for debugging
- Test restart scenarios manually

### 2. Production Environment
- Set appropriate restart limits
- Monitor system resources
- Set up external monitoring

### 3. Maintenance
- Regularly check log files
- Monitor restart frequency
- Update restart limits based on usage

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PowerShell    │    │  Backend Monitor│    │  Frontend App  │
│   Script        │    │  (monitor-server│    │  (React)       │
│                 │    │  .js)           │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Process Manager│    │  Health Checker │    │  Connection     │
│  (Start/Stop)   │    │  (HTTP requests)│    │  Monitor        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Backend Server │    │  Auto-Restart   │    │  Auto-Restart   │
│  (Express.js)   │    │  Logic          │    │  Logic          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Security Considerations

1. **Process Isolation**: Each service runs in its own process
2. **Resource Limits**: Restart limits prevent infinite loops
3. **Logging**: All restart events are logged for audit
4. **Graceful Shutdown**: Proper cleanup prevents resource leaks

## Performance Impact

- **Minimal Overhead**: Health checks run every 30 seconds
- **Efficient Restarts**: Quick restart process
- **Resource Management**: Proper cleanup of old processes
- **Scalable**: Can handle multiple restart scenarios

## Future Enhancements

1. **Web Dashboard**: Web-based monitoring interface
2. **Email Alerts**: Notifications for critical failures
3. **Metrics Collection**: Performance metrics and analytics
4. **Load Balancing**: Support for multiple instances
5. **Docker Integration**: Container-based deployment

---

## Quick Start Guide

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start the System**
   ```bash
   # Windows
   start-servers.bat
   
   # Or PowerShell
   .\start-servers.ps1
   ```

3. **Monitor Status**
   - Check console output for real-time status
   - Monitor connection status in the UI
   - Review logs in `backend/server-crashes.log`

4. **Test Auto-Restart**
   - Stop backend process manually
   - Watch automatic restart
   - Verify frontend reconnection

The system is now ready to provide reliable, auto-restarting services for the ARC Gaming Platform!

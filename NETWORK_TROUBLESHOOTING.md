# 🔗 Network Connection Troubleshooting Guide

## Current Setup
- **Your IP Address**: `192.168.1.8`
- **Backend Server**: Running on port 5000 ✅
- **Frontend Server**: Running on port 3000 ✅

## Issues Fixed

### 1. ✅ Configuration Updates
- Updated `frontend/src/config/config.ts` to automatically detect localhost vs network
- Updated CORS settings in `backend/server.js` to allow connections from your IP
- Updated Socket.IO CORS settings to allow cross-origin connections

### 2. ✅ Server Status
Both servers are now running and accessible:
- Backend: `http://192.168.1.8:5000` ✅
- Frontend: `http://192.168.1.8:3000` ✅

## Testing Steps

### Step 1: Test Basic Connection
1. Open `test-connection.html` in your browser
2. Click "Test HTTP Connection" - should show ✅
3. Click "Test Socket Connection" - should show ✅
4. Click "Test Random Connect" - should show ✅

### Step 2: Test from Another Device
1. On your friend's device, open: `http://192.168.1.8:3000`
2. They should see your app loading
3. If they see "looking for" screen, check the browser console for errors

### Step 3: Debug Socket.IO Issues
If your friend can't connect:

1. **Check Browser Console** (F12):
   - Look for CORS errors
   - Look for Socket.IO connection errors
   - Look for authentication errors

2. **Common Error Messages**:
   ```
   ❌ CORS Error: "Access to fetch at 'http://192.168.1.8:5000' from origin 'http://192.168.1.8:3000' has been blocked"
   ❌ Socket Error: "xhr poll error"
   ❌ Auth Error: "Authentication failed"
   ```

## Quick Fixes

### If CORS Error:
```javascript
// In backend/server.js - already fixed
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://192.168.1.8:3000",
    "http://192.168.1.8:3001"
  ],
  credentials: true
}));
```

### If Socket.IO Connection Fails:
1. Check if both devices are on same WiFi network
2. Try disabling firewall temporarily
3. Check if antivirus is blocking connections

### If "Looking for" Screen Stuck:
1. Check browser console for errors
2. Verify user is logged in
3. Check if token is valid
4. Try refreshing the page

## Manual Testing Commands

### Check Server Status:
```bash
# Check if servers are running
netstat -an | findstr :5000
netstat -an | findstr :3000

# Test HTTP connection
curl http://192.168.1.8:5000/api/health

# Test from another device
curl http://192.168.1.8:3000
```

### Check Network Connectivity:
```bash
# From another device, test if your IP is reachable
ping 192.168.1.8

# Test specific ports
telnet 192.168.1.8 5000
telnet 192.168.1.8 3000
```

## Common Issues & Solutions

### Issue 1: "Connection refused"
**Solution**: Make sure both servers are running
```bash
# Start backend
cd backend && npm start

# Start frontend (in new terminal)
cd frontend && npm start
```

### Issue 2: "CORS error"
**Solution**: Already fixed in server.js, restart backend if needed

### Issue 3: "Socket.IO connection failed"
**Solution**: 
1. Check if devices are on same network
2. Try using IP instead of localhost
3. Check firewall settings

### Issue 4: "Authentication failed"
**Solution**:
1. Make sure user is logged in
2. Check if token is valid
3. Clear browser cache and try again

### Issue 5: "Looking for" screen stuck
**Solution**:
1. Check browser console for errors
2. Verify socket connection is established
3. Check if user is in queue properly
4. Try refreshing the page

## Debug Information

### Current Configuration:
- **Backend URL**: `http://192.168.1.8:5000`
- **Frontend URL**: `http://192.168.1.8:3000`
- **Socket URL**: `http://192.168.1.8:5000`

### Test URLs:
- **Health Check**: `http://192.168.1.8:5000/api/health`
- **Queue Status**: `http://192.168.1.8:5000/api/random-connections/queue-status`
- **Frontend App**: `http://192.168.1.8:3000`
- **Connection Test**: `http://192.168.1.8:3000/test-connection.html`

## Next Steps

1. **Test the connection** using the test file
2. **Share your IP** with your friend: `192.168.1.8:3000`
3. **Monitor the console** for any errors
4. **Check both devices** are on the same WiFi network

If issues persist, check the browser console on your friend's device and share the error messages.

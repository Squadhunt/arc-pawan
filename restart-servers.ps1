# Restart ARC Servers Script
Write-Host "🔄 Restarting ARC Servers..." -ForegroundColor Yellow

# Kill existing processes on ports 3000 and 5000
Write-Host "🛑 Stopping existing servers..." -ForegroundColor Red
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Start backend server
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 5

# Start frontend server
Write-Host "🚀 Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start" -WindowStyle Normal

Write-Host "✅ Servers started! Check the new windows." -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan

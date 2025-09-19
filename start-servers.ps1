# ARC Gaming Platform - Auto-Restart Server Manager
# This script manages both backend and frontend with automatic restart capabilities

param(
    [switch]$MonitorOnly,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

# Configuration
$BackendPath = "backend"
$FrontendPath = "frontend"
$BackendPort = 5000
$FrontendPort = 3000
$MaxRestarts = 10
$RestartDelay = 5

# Colors for console output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Start-Backend {
    Write-ColorOutput "🚀 Starting Backend Server..." $Green
    
    if (Test-Port $BackendPort) {
        Write-ColorOutput "⚠️ Port $BackendPort is already in use. Stopping existing process..." $Yellow
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.js*" } | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
    
    Set-Location $BackendPath
    Start-Process -FilePath "node" -ArgumentList "monitor-server.js" -WindowStyle Normal -PassThru
    Set-Location ".."
    
    Write-ColorOutput "✅ Backend monitor started" $Green
}

function Start-Frontend {
    Write-ColorOutput "🎨 Starting Frontend..." $Cyan
    
    if (Test-Port $FrontendPort) {
        Write-ColorOutput "⚠️ Port $FrontendPort is already in use. Stopping existing process..." $Yellow
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*react-scripts*" } | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
    
    Set-Location $FrontendPath
    Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Normal -PassThru
    Set-Location ".."
    
    Write-ColorOutput "✅ Frontend started" $Cyan
}

function Start-MonitorOnly {
    Write-ColorOutput "📊 Starting Enhanced Monitor Only..." $Blue
    Set-Location $BackendPath
    Start-Process -FilePath "node" -ArgumentList "monitor-server.js" -WindowStyle Normal -PassThru
    Set-Location ".."
}

function Stop-AllServers {
    Write-ColorOutput "🛑 Stopping all servers..." $Red
    
    # Stop backend processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*monitor-server.js*" 
    } | Stop-Process -Force
    
    # Stop frontend processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -like "*react-scripts*" 
    } | Stop-Process -Force
    
    Write-ColorOutput "✅ All servers stopped" $Green
}

function Show-Status {
    Write-ColorOutput "`n📊 Server Status:" $Blue
    Write-ColorOutput "Backend (Port $BackendPort): $(if (Test-Port $BackendPort) { '🟢 Running' } else { '🔴 Stopped' })" $(if (Test-Port $BackendPort) { $Green } else { $Red })
    Write-ColorOutput "Frontend (Port $FrontendPort): $(if (Test-Port $FrontendPort) { '🟢 Running' } else { '🔴 Stopped' })" $(if (Test-Port $FrontendPort) { $Green } else { $Red })
    Write-ColorOutput ""
}

function Show-Help {
    Write-ColorOutput "`n🎮 ARC Gaming Platform - Server Manager" $Cyan
    Write-ColorOutput "=========================================" $Cyan
    Write-ColorOutput ""
    Write-ColorOutput "Usage:" $Yellow
    Write-ColorOutput "  .\start-servers.ps1                    - Start both backend and frontend" $White
    Write-ColorOutput "  .\start-servers.ps1 -MonitorOnly       - Start enhanced monitor only" $White
    Write-ColorOutput "  .\start-servers.ps1 -BackendOnly       - Start backend only" $White
    Write-ColorOutput "  .\start-servers.ps1 -FrontendOnly      - Start frontend only" $White
    Write-ColorOutput ""
    Write-ColorOutput "Features:" $Yellow
    Write-ColorOutput "  ✅ Auto-restart on crashes" $Green
    Write-ColorOutput "  ✅ Health monitoring" $Green
    Write-ColorOutput "  ✅ Port conflict resolution" $Green
    Write-ColorOutput "  ✅ Enhanced logging" $Green
    Write-ColorOutput ""
}

# Main execution
try {
    Write-ColorOutput "🎮 ARC Gaming Platform - Auto-Restart Server Manager" $Cyan
    Write-ColorOutput "=====================================================" $Cyan
    
    if ($MonitorOnly) {
        Start-MonitorOnly
    }
    elseif ($BackendOnly) {
        Start-Backend
    }
    elseif ($FrontendOnly) {
        Start-Frontend
    }
    else {
        # Start both servers
        Start-Backend
        Start-Sleep -Seconds 3
        Start-Frontend
    }
    
    Show-Status
    
    Write-ColorOutput "`n🎉 Servers started successfully!" $Green
    Write-ColorOutput "Backend: http://localhost:$BackendPort" $Blue
    Write-ColorOutput "Frontend: http://localhost:$FrontendPort" $Blue
    Write-ColorOutput "Health Check: http://localhost:$BackendPort/api/health" $Blue
    
    Write-ColorOutput "`n💡 Press Ctrl+C to stop all servers" $Yellow
    
    # Keep the script running
    while ($true) {
        Start-Sleep -Seconds 10
        Show-Status
    }
}
catch {
    Write-ColorOutput "❌ Error: $($_.Exception.Message)" $Red
    Show-Help
}
finally {
    # Cleanup on exit
    Write-ColorOutput "`n🛑 Cleaning up..." $Yellow
    Stop-AllServers
}

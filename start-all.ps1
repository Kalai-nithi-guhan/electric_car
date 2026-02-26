# Start Both Backend and Frontend Servers in Separate Terminals
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Electric Car Fleet Management System" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Backend and Frontend servers..." -ForegroundColor Yellow
Write-Host ""

# Start Flask Backend in a new PowerShell window
Write-Host "Opening Flask Backend Server (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "c:\projects\electir_car\start-backend.ps1"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Next.js Frontend in a new PowerShell window
Write-Host "Opening Next.js Frontend Server (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "c:\projects\electir_car\start-frontend.ps1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend (Flask):  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend (Next.js): http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Access the application at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the servers, close their respective terminal windows." -ForegroundColor Red
Write-Host ""

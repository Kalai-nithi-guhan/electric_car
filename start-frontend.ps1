# Start Next.js Frontend Server
Write-Host "Starting Next.js Frontend Server..." -ForegroundColor Green
Write-Host "Installing dependencies..." -ForegroundColor Yellow

# Navigate to Car_Web directory
Set-Location "c:\projects\electir_car\Car_Web"

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host"Installing npm packages..." -ForegroundColor Yellow
    npm install
}

Write-Host "Next.js server starting on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Run Next.js development server
npm run dev

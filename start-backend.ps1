# Start Flask Backend Server
Write-Host "Starting Flask Backend Server..." -ForegroundColor Green
Write-Host "Installing dependencies..." -ForegroundColor Yellow

# Activate virtual environment
& "c:\projects\electir_car\electricalCar_env\Scripts\Activate.ps1"

# Install dependencies
pip install -r requirements.txt

Write-Host "Flask server starting on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Run Flask app
python app.py

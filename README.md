# Electric Car Fleet Management System

This project connects a Flask backend with a Next.js frontend to manage an electric car fleet with role-based authentication.

## Project Structure

- **Backend**: Flask application (Python) - Port 5000
- **Frontend**: Next.js application (TypeScript/React) - Port 3000
- **Database**: SQLite (electricCar.db)

## Features

### Authentication & Authorization
- **Role-based access control** (Admin/Owner and Driver)
- Session-based authentication
- Protected routes
- User registration for drivers
- Login/logout functionality

### Owner Dashboard (`/owner`)
- View all vehicles in the fleet (Admin only)
- Monthly revenue and cost analytics
- Revenue and cost trends with charts
- Net profit/loss calculations
- Real-time data from database

### Driver Dashboard (`/driver`)
- Real-time battery charge status (Driver only)
- Remaining distance (km)
- Remaining time estimation
- Battery level visualization
- Auto-refresh every 3 seconds

## Quick Start

### Option 1: Start Both Servers Automatically (Recommended)

Run this command in PowerShell:
```powershell
.\start-all.ps1
```

This will open two separate terminal windows:
- One for the Flask backend (http://localhost:5000)
- One for the Next.js frontend (http://localhost:3000)

### Option 2: Start Servers Manually

#### Terminal 1 - Flask Backend:
```powershell
.\start-backend.ps1
```

#### Terminal 2 - Next.js Frontend:
```powershell
.\start-frontend.ps1
```

## Accessing the Application

Once both servers are running:
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/*

## Demo Credentials

### Admin (Owner):
- **Username**: `admin`
- **Password**: `admin@123`
- **Access**: Owner Dashboard with full fleet analytics

### Driver:
- Register a new driver account at `/register`
- Or use any existing driver credentials from your database

## Pages & Routes

- `/` - Home page with overview
- `/sign-in` - Login page (Admin or Driver)
- `/register` - Driver registration page
- `/owner` - Owner dashboard (Admin only)
- `/driver` - Driver dashboard (Driver only)

## API Endpoints

The Flask backend provides the following REST API endpoints:

### Authentication
- `POST /api/auth/login/admin` - Admin login
- `POST /api/auth/login/driver` - Driver login
- `POST /api/auth/register/driver` - Driver registration
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session info

### Data
- `GET /api/vehicles` - Get all vehicles with details
- `GET /api/financials` - Get monthly financial data
- `GET /api/driver/status` - Get current driver status
- `GET /api/dashboard/stats` - Get overall statistics

## Dependencies

### Backend (Python)
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-CORS

### Frontend (Node.js)
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## Security Features

- Session-based authentication with HTTP-only cookies
- CORS protection (only localhost:3000 allowed)
- Protected routes with role-based access control
- Password validation
- Automatic redirect on unauthorized access

## Development

The frontend fetches real data from the Flask backend API. CORS is configured to allow requests from http://localhost:3000 with credentials support for session management.

## Stopping the Servers

To stop the servers, press `Ctrl+C` in each terminal window or simply close the terminal windows.

## Notes

- HTML templates in the `templates/` folder are preserved for backward compatibility but are not used by the Next.js frontend
- The Next.js application is fully independent and communicates with Flask only through REST APIs
- Session persistence allows users to stay logged in across page refreshes

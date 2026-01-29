@echo off
echo ========================================
echo Starting PVP Civic Reporting Platform
echo ========================================

echo 1. Starting ML Service...
cd /d "c:\Users\harik\OneDrive\Desktop\PVP\backend-server\ml-service"
start "ML Service" cmd /k "python app.py"

timeout /t 5

echo 2. Starting Backend Server...
cd /d "c:\Users\harik\OneDrive\Desktop\PVP\backend-server"
start "Backend Server" cmd /k "npm run dev"

timeout /t 5

echo 3. Starting Admin Panel...
cd /d "c:\Users\harik\OneDrive\Desktop\PVP\admin-vite"
start "Admin Panel" cmd /k "npm run dev"

echo ========================================
echo All Services Started!
echo ========================================
echo ML Service: http://localhost:8000
echo Backend API: http://localhost:3000  
echo Admin Panel: http://localhost:5173
echo ========================================
echo Flutter App: Run 'flutter run' in civic_reporter folder
echo ========================================
pause
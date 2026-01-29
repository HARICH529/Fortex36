@echo off
echo Starting Civic Reporter Project...
echo.

echo Checking if backend server is running...
netstat -an | find "3000" > nul
if %errorlevel% == 0 (
    echo Backend server already running on port 3000
) else (
    echo Starting backend server...
    cd backend-server
    start "Backend Server" cmd /k "npm start"
    cd ..
    timeout /t 5 > nul
)

echo.
echo Checking if admin frontend is running...
netstat -an | find "5173" > nul
if %errorlevel% == 0 (
    echo Admin frontend already running on port 5173
) else (
    echo Starting admin frontend...
    cd admin-vite
    start "Admin Frontend" cmd /k "npm run dev"
    cd ..
)

echo.
echo All services started!
echo Backend: http://localhost:3000
echo Admin: http://localhost:5173
echo.
pause
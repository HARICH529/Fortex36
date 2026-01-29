@echo off
title Flutter App Connectivity Fix
color 0A

echo ========================================
echo    FLUTTER APP CONNECTIVITY FIX
echo ========================================
echo.

echo Step 1: Checking if backend server is running...
echo.

:: Test if backend is running on localhost
curl -s -o nul -w "%%{http_code}" "http://localhost:3000/api/v1/test" > temp_status.txt
set /p status=<temp_status.txt
del temp_status.txt

if "%status%"=="200" (
    echo ✅ Backend server is running on localhost:3000
) else (
    echo ❌ Backend server is NOT running on localhost:3000
    echo.
    echo Starting backend server...
    cd backend-server
    start "Backend Server" cmd /k "npm start"
    cd ..
    echo Waiting for server to start...
    timeout /t 5 /nobreak > nul
)

echo.
echo Step 2: Testing ngrok tunnel...
echo.

curl -s -o nul -w "%%{http_code}" "https://chromatolytic-unobsessed-therese.ngrok-free.dev/api/v1/test" > temp_ngrok.txt
set /p ngrok_status=<temp_ngrok.txt
del temp_ngrok.txt

if "%ngrok_status%"=="200" (
    echo ✅ Ngrok tunnel is working
) else (
    echo ❌ Ngrok tunnel is NOT working
    echo.
    echo Starting ngrok tunnel...
    start "Ngrok Tunnel" cmd /k "ngrok http 3000"
    echo.
    echo ⚠️  IMPORTANT: Update the ngrok URL in Flutter app if it changed!
    echo    Check the ngrok terminal for the new URL
)

echo.
echo Step 3: Testing Flutter app connectivity...
echo.

echo Testing login endpoint with test credentials...
curl -X POST "http://localhost:3000/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"mobiletest@example.com\",\"password\":\"mobile123\"}" ^
  --connect-timeout 5 ^
  --max-time 10

echo.
echo.

echo ========================================
echo           TROUBLESHOOTING STEPS
echo ========================================
echo.
echo 1. Make sure your mobile device is on the same network
echo 2. Check if Windows Firewall is blocking port 3000
echo 3. Try using your computer's IP address instead of localhost
echo 4. Verify the ngrok URL in Flutter app matches the active tunnel
echo.

echo Getting your computer's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set ip=%%a
    set ip=!ip: =!
    echo Your IP: !ip!
    echo Try using: http://!ip!:3000/api/v1 in Flutter app
)

echo.
echo ========================================
echo              NEXT STEPS
echo ========================================
echo.
echo 1. Open Flutter app and tap "Debug Connectivity"
echo 2. Run the connectivity test
echo 3. If still failing, try the IP address shown above
echo 4. Check Flutter console for detailed error messages
echo.

pause
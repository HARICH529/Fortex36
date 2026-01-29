@echo off
echo === Wireless ADB Connection Setup ===
echo.

echo 1. Connect phone via USB first
echo 2. Enable Developer Options and USB Debugging
echo 3. Make sure both devices are on same WiFi network
echo.

set /p phone_ip="Enter your phone's IP address: "

echo.
echo Enabling TCP/IP mode on port 5555...
adb tcpip 5555

timeout /t 3 /nobreak >nul

echo Connecting to %phone_ip%:5555...
adb connect %phone_ip%:5555

echo.
echo Checking connection...
adb devices

echo.
echo ✅ If connection successful, you can now:
echo    1. Disconnect USB cable
echo    2. Run: flutter run
echo    3. Your app will connect to: http://%phone_ip%:3000/api/v1

pause
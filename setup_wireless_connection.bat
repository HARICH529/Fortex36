@echo off
echo Setting up wireless ADB connection...

echo Step 1: Connect phone via USB first, then run this script
echo Step 2: Make sure phone and computer are on same WiFi

set /p phone_ip="Enter your phone's IP address (Settings > About > Status): "

echo Enabling wireless debugging...
adb tcpip 5555

echo Connecting to phone wirelessly...
adb connect %phone_ip%:5555

if %errorlevel% equ 0 (
    echo ✅ Wireless connection established!
    echo You can now disconnect USB cable
    echo Flutter app will use: http://10.1.5.79:3000/api/v1
) else (
    echo ❌ Connection failed. Check:
    echo 1. Phone IP address is correct
    echo 2. Both devices on same WiFi
    echo 3. USB was connected first
)

pause
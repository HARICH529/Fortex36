@echo off
echo Setting up USB connection for Flutter app...

adb forward tcp:3000 tcp:3000

if %errorlevel% equ 0 (
    echo ✅ Port forwarding enabled: Mobile port 3000 -> Computer port 3000
    echo Flutter app can now use: http://localhost:3000/api/v1
) else (
    echo ❌ Failed. Make sure:
    echo 1. USB debugging is enabled on phone
    echo 2. Phone is connected via USB
    echo 3. ADB is installed
)

pause
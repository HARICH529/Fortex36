@echo off
echo Adding Windows Firewall rule for port 3000...
echo.

echo This will allow Flutter app to connect to the backend server.
echo You may need to run this as Administrator.
echo.

netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000

if %errorlevel% equ 0 (
    echo ✅ Firewall rule added successfully!
    echo Flutter app should now be able to connect to: http://10.1.5.79:3000
) else (
    echo ❌ Failed to add firewall rule. Please run as Administrator.
    echo.
    echo Manual steps:
    echo 1. Right-click this file and select "Run as administrator"
    echo 2. Or manually add the rule in Windows Defender Firewall
)

echo.
pause
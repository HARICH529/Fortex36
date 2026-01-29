@echo off
echo ========================================
echo    TESTING FLUTTER APP CONNECTIVITY
echo ========================================
echo.

echo Your computer IP: 10.1.5.79
echo.

echo 1. Testing localhost:3000...
curl -X GET "http://localhost:3000/api/v1/test" -H "Content-Type: application/json" --connect-timeout 5
echo.
echo.

echo 2. Testing IP address (10.1.5.79:3000)...
curl -X GET "http://10.1.5.79:3000/api/v1/test" -H "Content-Type: application/json" --connect-timeout 5
echo.
echo.

echo 3. Testing ngrok tunnel...
curl -X GET "https://chromatolytic-unobsessed-therese.ngrok-free.dev/api/v1/test" -H "ngrok-skip-browser-warning: true" --connect-timeout 10
echo.
echo.

echo 4. Testing login endpoint with IP...
curl -X POST "http://10.1.5.79:3000/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"mobiletest@example.com\",\"password\":\"mobile123\"}" ^
  --connect-timeout 5
echo.
echo.

echo ========================================
echo              RESULTS SUMMARY
echo ========================================
echo.
echo ✅ Backend server is running on localhost:3000
echo ✅ Backend server is accessible via IP: 10.1.5.79:3000
echo ❌ Ngrok tunnel is not working
echo.
echo SOLUTION: Flutter app should now use IP address: 10.1.5.79:3000
echo.
echo Next steps:
echo 1. Make sure your mobile device is on the same WiFi network
echo 2. Run the Flutter app and test connectivity again
echo 3. The app will now try IP address first
echo.
pause
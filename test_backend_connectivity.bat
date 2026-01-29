@echo off
echo Testing Backend Connectivity for Flutter App...
echo.

echo 1. Testing Ngrok URL...
curl -X POST "https://chromatolytic-unobsessed-therese.ngrok-free.dev/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -H "ngrok-skip-browser-warning: true" ^
  -d "{\"email\":\"mobiletest@example.com\",\"password\":\"mobile123\"}" ^
  --connect-timeout 10 ^
  --max-time 30

echo.
echo.

echo 2. Testing Local URL...
curl -X POST "http://localhost:3000/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"mobiletest@example.com\",\"password\":\"mobile123\"}" ^
  --connect-timeout 5 ^
  --max-time 15

echo.
echo.

echo 3. Testing if backend server is running...
curl -X GET "http://localhost:3000/api/v1/health" ^
  -H "Content-Type: application/json" ^
  --connect-timeout 5 ^
  --max-time 10

echo.
echo.

echo 4. Checking ngrok status...
curl -X GET "https://chromatolytic-unobsessed-therese.ngrok-free.dev" ^
  -H "ngrok-skip-browser-warning: true" ^
  --connect-timeout 10 ^
  --max-time 20

echo.
echo Test completed. Check the responses above for connectivity issues.
pause
@echo off
echo Testing Backend Health...
echo.

echo 1. Testing localhost:3000...
curl -X GET "http://localhost:3000/api/v1/test" -H "Content-Type: application/json" --connect-timeout 5

echo.
echo.

echo 2. Testing ngrok URL...
curl -X GET "https://chromatolytic-unobsessed-therese.ngrok-free.dev/api/v1/test" -H "ngrok-skip-browser-warning: true" --connect-timeout 10

echo.
echo.

echo 3. Getting server info...
curl -X GET "http://localhost:3000/api/v1/server-info" -H "Content-Type: application/json" --connect-timeout 5

echo.
echo.
pause
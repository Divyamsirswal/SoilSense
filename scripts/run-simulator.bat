@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo      SoilGuardian Hardware Simulator Runner
echo ===============================================

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    exit /b 1
)

:: Check if farm ID was provided
if "%~1"=="" (
    echo Usage: %0 ^<farm_id^>
    echo Example: %0 clm9f8yxz0000m0g9v01z7ier
    
    echo.
    echo Available farms:
    echo To find your farm ID, look at the URL when viewing a farm in your browser:
    echo http://localhost:3000/farms/YOUR_FARM_ID
    echo.
    
    exit /b 1
)

set FARM_ID=%~1

:: Update the farm ID in the simulator script
echo Setting up simulator with farm ID: %FARM_ID%
powershell -Command "(Get-Content scripts\simulate_hardware.js) -replace 'farmId: \"YOUR_FARM_ID\"', 'farmId: \"%FARM_ID%\"' | Set-Content scripts\simulate_hardware.js"

:: Install dependencies if needed
if not exist "node_modules\axios" (
    echo Installing required dependencies...
    call npm install axios
)

echo Starting hardware simulator...
echo Press Ctrl+C to stop the simulation
echo ===============================================

:: Run the simulator
node scripts\simulate_hardware.js 
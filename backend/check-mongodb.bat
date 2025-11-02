@echo off
echo Checking MongoDB installation and status...
echo.

echo Checking if MongoDB is installed...
where mongod >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB is installed
    echo.
    echo Checking MongoDB service status...
    sc query MongoDB >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ MongoDB service exists
        echo.
        echo Starting MongoDB service...
        net start MongoDB
        if %errorlevel% == 0 (
            echo ✅ MongoDB service started successfully
            echo.
            echo You can now run: npm run seed
        ) else (
            echo ❌ Failed to start MongoDB service
            echo Try running as Administrator
        )
    ) else (
        echo ❌ MongoDB service not found
        echo MongoDB may not be installed as a service
        echo.
        echo Try starting manually:
        echo mongod --dbpath C:\data\db
    )
) else (
    echo ❌ MongoDB is not installed
    echo.
    echo Please install MongoDB Community Server from:
    echo https://www.mongodb.com/try/download/community
    echo.
    echo Or use MongoDB Atlas (cloud):
    echo https://www.mongodb.com/cloud/atlas
)

echo.
pause

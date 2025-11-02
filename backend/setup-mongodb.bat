@echo off
echo ========================================
echo MongoDB Setup Options
echo ========================================
echo.
echo Choose your MongoDB setup method:
echo.
echo 1. Use Docker Compose (Recommended if Docker is installed)
echo 2. Use MongoDB Atlas (Cloud - Free tier available)
echo 3. Install MongoDB locally
echo.
echo ========================================
echo.
echo OPTION 1: Docker Compose
echo ========================================
echo If you have Docker installed, run:
echo   docker-compose up -d mongodb
echo.
echo This will start MongoDB on port 27017
echo Connection string: mongodb://localhost:27017/shrishay-foundation
echo.
echo ========================================
echo.
echo OPTION 2: MongoDB Atlas (Cloud)
echo ========================================
echo 1. Go to https://www.mongodb.com/cloud/atlas
echo 2. Create a free account
echo 3. Create a new cluster (free tier)
echo 4. Add your IP to whitelist
echo 5. Create a database user
echo 6. Get your connection string
echo 7. Update .env file with:
echo    MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shrishay-foundation
echo.
echo ========================================
echo.
echo OPTION 3: Local MongoDB Installation
echo ========================================
echo 1. Download MongoDB Community Server from:
echo    https://www.mongodb.com/try/download/community
echo 2. Install with default settings
echo 3. Start MongoDB service:
echo    - Windows: MongoDB should start automatically
echo    - Or run: net start MongoDB
echo 4. Connection string: mongodb://localhost:27017/shrishay-foundation
echo.
echo ========================================
echo.
pause

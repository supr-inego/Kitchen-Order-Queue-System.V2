@echo off
echo ======================================
echo   KitchenPOS Setup (Windows)
echo ======================================

echo.
echo 1. Setting up Django backend...
cd backend-api
python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt -q
python manage.py migrate
python seed.py
call deactivate
cd ..
echo    Done.

echo.
echo 2. Setting up React web frontend...
cd frontend-web
npm install --silent
cd ..
echo    Done.

echo.
echo 3. Setting up Expo mobile app...
cd mobile-app
npm install --silent
cd ..
echo    Done.

echo.
echo ======================================
echo   Setup Complete!
echo ======================================
echo.
echo   Start backend:  cd backend-api ^& .venv\Scripts\activate ^& python manage.py runserver
echo   Start web:      cd frontend-web ^& npm run dev
echo   Start mobile:   cd mobile-app ^& npm run start
echo.
echo   Admin: admin@kitchen.com / admin123
echo   Staff: staff@kitchen.com / staff123
pause

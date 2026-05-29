@echo off
echo ======================================
echo   KitchenPOS Setup (Windows)
echo ======================================

echo.
echo 1. Setting up Django backend...
cd backend
python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt -q
python manage.py migrate
python seed.py
call deactivate
cd ..
echo    Done.

echo.
echo 2. Setting up React frontend...
cd frontend
npm install --silent
cd ..
echo    Done.

echo.
echo ======================================
echo   Setup Complete!
echo ======================================
echo.
echo   Start backend:  cd backend ^& .venv\Scripts\activate ^& python manage.py runserver
echo   Start frontend: cd frontend ^& npm run dev
echo.
echo   Admin: admin@kitchen.com / admin123
echo   Staff: staff@kitchen.com / staff123
pause

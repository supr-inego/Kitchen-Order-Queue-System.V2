#!/bin/bash
set -e
echo "======================================"
echo "  KitchenPOS Setup Script"
echo "======================================"

# Backend
echo ""
echo "1. Setting up Django backend..."
cd backend-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -q
python manage.py migrate
python seed.py
deactivate
cd ..
echo "   ✅ Backend ready"

# Frontend
echo ""
echo "2. Setting up React web frontend..."
cd frontend-web
npm install --silent
cd ..

echo ""
echo "3. Setting up Expo mobile app..."
cd mobile-app
npm install --silent
cd ..
echo "   ✅ Frontend ready"

echo ""
echo "======================================"
echo "  Setup Complete!"
echo "======================================"
echo ""
echo "  To start the app:"
echo "    bash start.sh"
echo ""
echo "  Or manually:"
echo "    Backend:  cd backend-api && python manage.py runserver"
echo "    Web:      cd frontend-web && npm run dev"
echo "    Mobile:   cd mobile-app && npm run start"
echo ""
echo "  Demo logins:"
echo "    Admin:  admin@kitchen.com / admin123"
echo "    Staff:  staff@kitchen.com / staff123"
echo ""
echo "  Chatbot (optional):"
echo "    1. Install Ollama: https://ollama.com"
echo "    2. ollama pull llama3.2"
echo "    3. ollama serve"
echo ""

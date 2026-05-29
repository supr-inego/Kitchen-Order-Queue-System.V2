#!/bin/bash
set -e
echo "======================================"
echo "  KitchenPOS Setup Script"
echo "======================================"

# Backend
echo ""
echo "1. Setting up Django backend..."
cd backend
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
echo "2. Setting up React frontend..."
cd frontend
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
echo "    Backend:  cd backend && python manage.py runserver"
echo "    Frontend: cd frontend && npm run dev"
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

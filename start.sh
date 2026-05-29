#!/bin/bash
echo "🍽️  Starting KitchenPOS..."

# Start backend
echo "▶  Starting Django backend on :8000"
cd backend
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo "▶  Starting React frontend on :5173"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ KitchenPOS is running!"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/api/"
echo ""
echo "   Admin:     admin@kitchen.com / admin123"
echo "   Staff:     staff@kitchen.com / staff123"
echo ""
echo "   Chatbot:   Make sure Ollama is running:"
echo "              ollama serve"
echo "              ollama run llama3.2"
echo ""
echo "Press Ctrl+C to stop all services"
wait

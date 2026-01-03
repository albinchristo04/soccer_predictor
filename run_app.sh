#!/bin/bash
# Run both backend and frontend servers

# Kill any existing processes
pkill -f "uvicorn backend.main" 2>/dev/null
pkill -f "next dev" 2>/dev/null

cd /home/roaltshu/code/soccer_predictor

# Activate virtual environment and start backend
source .venv/bin/activate
echo "Starting backend on port 8000..."
uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "==================================="
echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:3000"
echo "==================================="
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C and kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both
wait

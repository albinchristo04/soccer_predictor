#!/bin/bash

# Script to retrain all models with correct Python environment
# This ensures sklearn 1.7.2 is used for consistency

echo "====================================================="
echo "Soccer Predictor - Model Retraining Script"
echo "====================================================="
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Activate virtual environment
VENV_PYTHON="$PROJECT_DIR/.venv/bin/python"

if [ ! -f "$VENV_PYTHON" ]; then
    echo "ERROR: Virtual environment not found at $PROJECT_DIR/.venv"
    echo "Please create a virtual environment first."
    exit 1
fi

# Check sklearn version
echo "Checking Python environment..."
SKLEARN_VERSION=$($VENV_PYTHON -c "import sklearn; print(sklearn.__version__)")
echo "Using Python: $VENV_PYTHON"
echo "sklearn version: $SKLEARN_VERSION"
echo ""

if [ "$SKLEARN_VERSION" != "1.7.2" ]; then
    echo "WARNING: sklearn version is $SKLEARN_VERSION, expected 1.7.2"
    echo "Models may have compatibility issues."
    echo ""
fi

# Train models
echo "====================================================="
echo "Step 1: Training Models"
echo "====================================================="
echo ""
$VENV_PYTHON "$SCRIPT_DIR/train_league_models.py" <<EOF
all
EOF

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Model training failed!"
    exit 1
fi

echo ""
echo "====================================================="
echo "Step 2: Analyzing Models & Generating Visualizations"
echo "====================================================="
echo ""
$VENV_PYTHON "$SCRIPT_DIR/analyze_model.py" <<EOF
all
EOF

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Model analysis failed!"
    exit 1
fi

echo ""
echo "====================================================="
echo "SUCCESS: All models retrained and analyzed!"
echo "====================================================="
echo ""
echo "Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Test predictions to verify no sklearn warnings"
echo "3. Check analytics page for new visualizations"
echo ""

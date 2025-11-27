#!/bin/bash
# Setup script for material database validation

echo "Setting up Python virtual environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✓ Setup complete!"
echo ""
echo "To validate the database, run:"
echo "  source venv/bin/activate"
echo "  python scripts/validate.py"
echo ""
echo "Or use the shortcut:"
echo "  ./scripts/validate.sh"

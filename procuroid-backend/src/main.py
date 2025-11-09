"""
Main Flask application entry point.
Centralizes all route blueprints from agents, api, core, and services modules.
"""
from flask import Flask, jsonify
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

# Optional CORS import
try:
    from flask_cors import CORS
except ImportError:
    CORS = None

# Import blueprints from different modules
from agents import agents_bp
from api import api_bp

# Create Flask app
app = Flask(__name__)

# Enable CORS with explicit allow list (development + Cloud Run)
if CORS:
    allow_list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://procuroid.vercel.app",
        "https://procuroid-git-main-avihans-projects.vercel.app/",
        "https://procuroid-cqmnl66py-avihans-projects.vercel.app",
    ]
    CORS(
        app,
        resources={r"/*": {
            "origins": allow_list,
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }},
        supports_credentials=True,
        automatic_options=True,  # Automatically handle OPTIONS requests
    )
    print(f"CORS: allowing {allow_list}")
else:
    print("WARNING: flask-cors not installed. CORS will not work properly.")

# Register all blueprints
app.register_blueprint(api_bp)
app.register_blueprint(agents_bp)


@app.route("/", methods=["GET"])
def root():
    """Root endpoint showing all available routes"""
    return jsonify({
        "message": "Procuroid Backend API",
        "version": "1.0.0",
        "status": "running",
        "modules": {
            "api": "Authentication and procurement endpoints",
            "agents": "AI agent webhooks and processing"
        }
    })


if __name__ == "__main__":
    # Get port from environment variable (Cloud Run requirement) or default to 5000
    port = int(os.environ.get("PORT", 8080))
    
    print("Starting Procuroid Backend Server...")
    print(f"Server running on http://0.0.0.0:{port}")
    print("API endpoints:")
    print("  - /auth/signup")
    print("  - /auth/signin")
    print("  - /procurement-jobs")
    print("  - /webhook/procurement-job")
    print("-" * 50)
    
    # For production, use gunicorn instead of app.run
    # Development mode
    app.run(host="0.0.0.0", port=port, debug=False)


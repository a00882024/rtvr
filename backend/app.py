from flask import Flask
from flask_cors import CORS
from database import db
from routes.documents import documents_bp
from routes.notebooks import notebooks_bp
from models.document import Document
from models.notebook import Notebook
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app and database
app = Flask(__name__)

# Enable CORS for frontend development
CORS(app, resources={r"/v1/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# PostgreSQL configuration
DB_USER = os.getenv('DB_USER', 'rtvr_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'rtvr_password')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'rtvr_db')

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# File upload configuration
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), UPLOAD_FOLDER)
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_FILE_SIZE', 16 * 1024 * 1024))  # 16MB default

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)

# Register blueprints with v1 prefix
app.register_blueprint(documents_bp, url_prefix='/v1')
app.register_blueprint(notebooks_bp, url_prefix='/v1')

# Create database tables
with app.app_context():
    db.create_all()

# Define a simple route to test the API
@app.route('/')
def home():
    return {"message": "Welcome to the User Management API"}

# Run the app
if __name__ == '__main__':
    app.run(debug=True)

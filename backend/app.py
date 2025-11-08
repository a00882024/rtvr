from flask import Flask
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

# PostgreSQL configuration
DB_USER = os.getenv('DB_USER', 'rtvr_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'rtvr_password')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'rtvr_db')

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Register blueprints
app.register_blueprint(documents_bp)
app.register_blueprint(notebooks_bp)

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

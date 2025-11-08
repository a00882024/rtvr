from flask import Flask
from database import db
from routes.documents import documents_bp
from models.document import Document


# Initialize Flask app and database
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///actividad_8.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Register blueprints
app.register_blueprint(documents_bp)

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

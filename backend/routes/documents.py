from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
from database import db
from models.document import Document
import os

documents_bp = Blueprint('documents', __name__)

ALLOWED_EXTENSIONS = {'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@documents_bp.route('/documents', methods=['GET'])
def get_documents():
    """
    Retrieve all documents

    return: A list of all documents as JSON objects
    """
    documents = Document.query.all()
    return jsonify([document.to_dict() for document in documents])

@documents_bp.route('/documents/<int:document_id>', methods=['GET'])
def get_document(document_id):
    """
    Retrieve a single document by ID

    param document_id: ID of the document to retrieve

    return: The document as a JSON object
    """
    document = Document.query.get_or_404(document_id)
    return jsonify(document.to_dict())

@documents_bp.route('/documents', methods=['POST'])
def create_document():
    """
    Create a new document

    Accepts either JSON or multipart/form-data
    For file uploads, the file will be saved and content extracted

    param title: Title of the document
    param description: Description of the document
    param extracted_content: Extracted content of the document
    param file_name: Name of the file
    param file_type: Type of the file
    param file_size: Size of the file in bytes
    param processed: Boolean indicating if the document has been processed
    param notebook_id: (Optional) ID of the notebook this document belongs to

    return: The created document as a JSON object
    """
    # Handle JSON request
    if request.is_json:
        data = request.get_json()
        new_document = Document(
            title=data['title'],
            description=data.get('description'),
            extracted_content=data['extracted_content'],
            file_name=data['file_name'],
            file_type=data['file_type'],
            file_size=data['file_size'],
            processed=data.get('processed', False),
            notebook_id=data.get('notebook_id')
        )
    # Handle form data with file upload
    else:
        data = request.form
        file = request.files.get('file')

        if not file:
            return jsonify({"error": "No file provided"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed. Only .txt files are supported"}), 400

        # Secure the filename
        filename = secure_filename(file.filename)

        # Create a unique filename to avoid conflicts
        import uuid
        unique_filename = f"{uuid.uuid4()}_{filename}"

        # Save the file
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)

        new_document = Document(
            title=data['title'],
            description=data.get('description'),
            extracted_content=data.get('extracted_content', ''),
            file_name=filename,  # Store original filename
            file_type=data.get('file_type', 'txt'),
            file_size=int(data.get('file_size', 0)),
            processed=data.get('processed', 'false').lower() == 'true',
            notebook_id=int(data['notebook_id']) if data.get('notebook_id') else None
        )

    db.session.add(new_document)
    db.session.commit()
    return jsonify(new_document.to_dict()), 201

@documents_bp.route('/documents/<int:document_id>', methods=['PUT'])
def update_document(document_id):
    """
    Update an existing document

    param document_id: ID of the document to update
    param title: (Optional) New title of the document
    param description: (Optional) New description of the document
    param extracted_content: (Optional) New extracted content of the document
    param file_name: (Optional) New name of the file
    param file_type: (Optional) New type of the file
    param file_size: (Optional) New size of the file in bytes
    param processed: (Optional) Boolean indicating if the document has been processed
    param notebook_id: (Optional) New notebook ID to assign the document to

    return: The updated document as a JSON object
    """
    data = request.get_json()
    document = Document.query.get_or_404(document_id)
    document.title = data.get('title', document.title)
    document.description = data.get('description', document.description)
    document.extracted_content = data.get('extracted_content', document.extracted_content)
    document.file_name = data.get('file_name', document.file_name)
    document.file_type = data.get('file_type', document.file_type)
    document.file_size = data.get('file_size', document.file_size)
    document.processed = data.get('processed', document.processed)
    document.notebook_id = data.get('notebook_id', document.notebook_id)
    db.session.commit()
    return jsonify(document.to_dict())

@documents_bp.route('/documents/<int:document_id>', methods=['DELETE'])
def delete_document(document_id):
    """
    Delete a document by ID

    param document_id: ID of the document to delete
    """
    document = Document.query.get_or_404(document_id)
    db.session.delete(document)
    db.session.commit()
    return jsonify({"message": "Document Deleted"}), 200

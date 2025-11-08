from flask import Blueprint, jsonify, request
from database import db
from models.document import Document

documents_bp = Blueprint('documents', __name__)

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

    param title: Title of the document
    param description: Description of the document
    param extracted_content: Extracted content of the document
    param file_name: Name of the file
    param file_type: Type of the file
    param file_size: Size of the file in bytes
    param processed: Boolean indicating if the document has been processed

    return: The created document as a JSON object
    """
    data = request.get_json()
    new_document = Document(
        title=data['title'],
        description=data.get('description'),
        extracted_content=data['extracted_content'],
        file_name=data['file_name'],
        file_type=data['file_type'],
        file_size=data['file_size'],
        processed=data.get('processed', False)
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

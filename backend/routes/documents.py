from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
from database import db
from models.document import Document
from models.question import Question
from minio.error import S3Error
from services.openai_service import openai_service
import os
import io
import uuid

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

    return: The document as a JSON object with questions included
    """
    document = Document.query.get_or_404(document_id)
    return jsonify(document.to_dict(include_questions=True))

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
        unique_filename = f"{uuid.uuid4()}_{filename}"

        # Get MinIO client and bucket name from app config
        minio_client = current_app.config['MINIO_CLIENT']
        bucket_name = current_app.config['MINIO_BUCKET_NAME']

        # Upload file to MinIO
        try:
            # Read file content
            file_content = file.read()
            file_size = len(file_content)

            # Upload to MinIO
            minio_client.put_object(
                bucket_name,
                unique_filename,
                io.BytesIO(file_content),
                file_size,
                content_type='text/plain'
            )
        except S3Error as e:
            return jsonify({"error": f"Failed to upload file to storage: {str(e)}"}), 500

        new_document = Document(
            title=data['title'],
            description=data.get('description'),
            extracted_content=data.get('extracted_content', ''),
            file_name=unique_filename,  # Store unique filename for MinIO
            file_type=data.get('file_type', 'txt'),
            file_size=file_size,
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

    # Delete file from MinIO if it exists
    if document.file_name:
        minio_client = current_app.config['MINIO_CLIENT']
        bucket_name = current_app.config['MINIO_BUCKET_NAME']
        try:
            minio_client.remove_object(bucket_name, document.file_name)
        except S3Error as e:
            # Log error but continue with database deletion
            print(f"Failed to delete file from MinIO: {e}")

    db.session.delete(document)
    db.session.commit()
    return jsonify({"message": "Document Deleted"}), 200

@documents_bp.route('/documents/<int:document_id>/download', methods=['GET'])
def download_document(document_id):
    """
    Download a document file from MinIO

    param document_id: ID of the document to download

    return: The file content
    """
    from flask import Response

    document = Document.query.get_or_404(document_id)

    if not document.file_name:
        return jsonify({"error": "Document has no associated file"}), 404

    minio_client = current_app.config['MINIO_CLIENT']
    bucket_name = current_app.config['MINIO_BUCKET_NAME']

    try:
        # Get object from MinIO
        response = minio_client.get_object(bucket_name, document.file_name)
        file_content = response.read()
        response.close()
        response.release_conn()

        return Response(
            file_content,
            mimetype='text/plain',
            headers={
                'Content-Disposition': f'attachment; filename={document.file_name}'
            }
        )
    except S3Error as e:
        return jsonify({"error": f"Failed to retrieve file: {str(e)}"}), 500

@documents_bp.route('/documents/<int:document_id>/summary', methods=['POST'])
def generate_summary(document_id):
    """
    Generate a summary for a document using OpenAI API

    The summary is generated from the file content stored in MinIO bucket.
    This endpoint can be called multiple times to regenerate the summary.

    param document_id: ID of the document to generate summary for

    return: The updated document with the generated summary
    """
    document = Document.query.get_or_404(document_id)

    if not document.file_name:
        return jsonify({"error": "Document has no associated file"}), 400

    minio_client = current_app.config['MINIO_CLIENT']
    bucket_name = current_app.config['MINIO_BUCKET_NAME']

    try:
        # Get file content from MinIO
        response = minio_client.get_object(bucket_name, document.file_name)
        file_content = response.read().decode('utf-8')
        response.close()
        response.release_conn()

        if not file_content or not file_content.strip():
            return jsonify({"error": "Document file is empty"}), 400

        # Generate summary using OpenAI
        try:
            summary = openai_service.generate_summary(file_content)

            if not summary:
                return jsonify({"error": "Failed to generate summary"}), 500

            # Update document with summary and mark as processed
            document.summary = summary
            document.processed = True
            db.session.commit()

            return jsonify(document.to_dict()), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": f"OpenAI API error: {str(e)}"}), 500

    except S3Error as e:
        return jsonify({"error": f"Failed to retrieve file from storage: {str(e)}"}), 500
    except UnicodeDecodeError:
        return jsonify({"error": "File content is not valid UTF-8 text"}), 400

@documents_bp.route('/documents/<int:document_id>/questions', methods=['POST'])
def generate_questions(document_id):
    """
    Generate multiple choice questions for a document using OpenAI API

    The questions are generated from the file content stored in MinIO bucket.
    Supports chunking for large documents.

    Query parameters:
    - num_questions (optional): Number of questions to generate (default: 5)
    - regenerate (optional): If true, delete existing questions and regenerate (default: false)

    param document_id: ID of the document to generate questions for

    return: The updated document with the generated questions
    """
    document = Document.query.get_or_404(document_id)

    if not document.file_name:
        return jsonify({"error": "Document has no associated file"}), 400

    # Get query parameters
    num_questions = request.args.get('num_questions', default=5, type=int)
    regenerate = request.args.get('regenerate', default='false', type=str).lower() == 'true'

    # Validate num_questions
    if num_questions < 1 or num_questions > 20:
        return jsonify({"error": "Number of questions must be between 1 and 20"}), 400

    # Check if questions already exist
    existing_questions = Question.query.filter_by(document_id=document_id).count()
    if existing_questions > 0 and not regenerate:
        return jsonify({
            "error": "Questions already exist for this document. Use regenerate=true to replace them."
        }), 400

    # Delete existing questions if regenerating
    if regenerate and existing_questions > 0:
        Question.query.filter_by(document_id=document_id).delete()
        db.session.commit()

    minio_client = current_app.config['MINIO_CLIENT']
    bucket_name = current_app.config['MINIO_BUCKET_NAME']

    try:
        # Get file content from MinIO
        response = minio_client.get_object(bucket_name, document.file_name)
        file_content = response.read().decode('utf-8')
        response.close()
        response.release_conn()

        if not file_content or not file_content.strip():
            return jsonify({"error": "Document file is empty"}), 400

        # Generate questions using OpenAI
        try:
            questions_data = openai_service.generate_questions(file_content, num_questions)

            if not questions_data:
                return jsonify({"error": "Failed to generate questions"}), 500

            # Save questions to database
            created_questions = []
            for q_data in questions_data:
                question = Question(
                    question_text=q_data.get('question_text'),
                    option_a=q_data.get('option_a'),
                    option_b=q_data.get('option_b'),
                    option_c=q_data.get('option_c'),
                    option_d=q_data.get('option_d'),
                    correct_answer=q_data.get('correct_answer'),
                    explanation=q_data.get('explanation'),
                    chunk_index=q_data.get('chunk_index', 0),
                    document_id=document_id
                )
                db.session.add(question)
                created_questions.append(question)

            db.session.commit()

            # Return document with questions included
            return jsonify(document.to_dict(include_questions=True)), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": f"OpenAI API error: {str(e)}"}), 500

    except S3Error as e:
        return jsonify({"error": f"Failed to retrieve file from storage: {str(e)}"}), 500
    except UnicodeDecodeError:
        return jsonify({"error": "File content is not valid UTF-8 text"}), 400

@documents_bp.route('/documents/<int:document_id>/questions', methods=['GET'])
def get_questions(document_id):
    """
    Retrieve all questions for a document

    param document_id: ID of the document

    return: List of questions as JSON objects
    """
    document = Document.query.get_or_404(document_id)
    questions = Question.query.filter_by(document_id=document_id).all()

    return jsonify([question.to_dict() for question in questions]), 200

from flask import Blueprint, jsonify, request
from database import db
from models.notebook import Notebook

notebooks_bp = Blueprint('notebooks', __name__)

@notebooks_bp.route('/notebooks', methods=['GET'])
def get_notebooks():
    """
    Retrieve all notebooks

    return: A list of all notebooks as JSON objects
    """
    notebooks = Notebook.query.all()
    return jsonify([notebook.to_dict() for notebook in notebooks])

@notebooks_bp.route('/notebooks/<int:notebook_id>', methods=['GET'])
def get_notebook(notebook_id):
    """
    Retrieve a single notebook by ID

    param notebook_id: ID of the notebook to retrieve

    return: The notebook as a JSON object
    """
    notebook = Notebook.query.get_or_404(notebook_id)
    return jsonify(notebook.to_dict())

@notebooks_bp.route('/notebooks', methods=['POST'])
def create_notebook():
    """
    Create a new notebook

    param owner_user_id: ID of the user who owns the notebook
    param title: Title of the notebook
    param description: Description of the notebook
    param visibility: Visibility level of the notebook
    param subject: Subject or category of the notebook
    param color_tag: Color tag for visual organization
    param document_count: Number of documents in the notebook

    return: The created notebook as a JSON object
    """
    data = request.get_json()
    new_notebook = Notebook(
        owner_user_id=data['owner_user_id'],
        title=data['title'],
        description=data.get('description'),
        visibility=data.get('visibility', 0),
        subject=data.get('subject'),
        color_tag=data.get('color_tag'),
        document_count=data.get('document_count', 0)
    )
    db.session.add(new_notebook)
    db.session.commit()
    return jsonify(new_notebook.to_dict()), 201

@notebooks_bp.route('/notebooks/<int:notebook_id>', methods=['PUT'])
def update_notebook(notebook_id):
    """
    Update an existing notebook

    param notebook_id: ID of the notebook to update
    param owner_user_id: (Optional) New owner user ID
    param title: (Optional) New title of the notebook
    param description: (Optional) New description of the notebook
    param visibility: (Optional) New visibility level
    param subject: (Optional) New subject or category
    param color_tag: (Optional) New color tag
    param document_count: (Optional) New document count

    return: The updated notebook as a JSON object
    """
    data = request.get_json()
    notebook = Notebook.query.get_or_404(notebook_id)
    notebook.owner_user_id = data.get('owner_user_id', notebook.owner_user_id)
    notebook.title = data.get('title', notebook.title)
    notebook.description = data.get('description', notebook.description)
    notebook.visibility = data.get('visibility', notebook.visibility)
    notebook.subject = data.get('subject', notebook.subject)
    notebook.color_tag = data.get('color_tag', notebook.color_tag)
    notebook.document_count = data.get('document_count', notebook.document_count)
    db.session.commit()
    return jsonify(notebook.to_dict())

@notebooks_bp.route('/notebooks/<int:notebook_id>', methods=['DELETE'])
def delete_notebook(notebook_id):
    """
    Delete a notebook by ID

    param notebook_id: ID of the notebook to delete
    """
    notebook = Notebook.query.get_or_404(notebook_id)
    db.session.delete(notebook)
    db.session.commit()
    return jsonify({"message": "Notebook Deleted"}), 200

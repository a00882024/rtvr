from database import db

class Document(db.Model):
    """
    Model for storing document information

    param title: Title of the document
    param description: Description of the document
    param extracted_content: Extracted content of the document
    param file_name: Name of the file
    param file_type: Type of the file
    param file_size: Size of the file in bytes
    param processed: Boolean indicating if the document has been processed by AI
    param notebook_id: ID of the notebook this document belongs to (optional)
    """
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    extracted_content = db.Column(db.Text, nullable=False)
    file_name = db.Column(db.String(200), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    processed = db.Column(db.Boolean, default=False)
    summary = db.Column(db.Text, nullable=True)

    # Foreign key: A document can belong to one notebook
    notebook_id = db.Column(db.Integer, db.ForeignKey('notebook.id'), nullable=True)

    # Relationship: A document can have many questions
    questions = db.relationship('Question', backref='document', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Document {self.title}>'

    def to_dict(self, include_questions=False):
        result = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'extracted_content': self.extracted_content,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'processed': self.processed,
            'summary': self.summary,
            'notebook_id': self.notebook_id
        }
        if include_questions:
            result['questions'] = [question.to_dict() for question in self.questions]
        return result


from database import db

class Notebook(db.Model):
    """
    Model for storing notebook information

    param owner_user_id: ID of the user who owns the notebook
    param title: Title of the notebook
    param description: Description of the notebook
    param visibility: Visibility level of the notebook (e.g., 0=private, 1=public)
    param subject: Subject or category of the notebook
    param color_tag: Color tag for visual organization
    param document_count: Number of documents in the notebook
    """
    id = db.Column(db.Integer, primary_key=True)
    owner_user_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    visibility = db.Column(db.Integer, nullable=False, default=0)
    subject = db.Column(db.String(100), nullable=True)
    color_tag = db.Column(db.String(50), nullable=True)
    document_count = db.Column(db.Integer, nullable=False, default=0)

    def __repr__(self):
        return f'<Notebook {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'owner_user_id': self.owner_user_id,
            'title': self.title,
            'description': self.description,
            'visibility': self.visibility,
            'subject': self.subject,
            'color_tag': self.color_tag,
            'document_count': self.document_count
        }

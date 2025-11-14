from database import db
from datetime import datetime

class Question(db.Model):
    """
    Model for storing multiple choice questions generated from documents

    param question_text: The question text
    param option_a: First answer option
    param option_b: Second answer option
    param option_c: Third answer option
    param option_d: Fourth answer option
    param correct_answer: The correct option ('A', 'B', 'C', or 'D')
    param explanation: Explanation of why the answer is correct
    param chunk_index: Index of the content chunk this question was generated from
    param document_id: ID of the document this question belongs to
    """
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(500), nullable=False)
    option_b = db.Column(db.String(500), nullable=False)
    option_c = db.Column(db.String(500), nullable=False)
    option_d = db.Column(db.String(500), nullable=False)
    correct_answer = db.Column(db.String(1), nullable=False)  # 'A', 'B', 'C', or 'D'
    explanation = db.Column(db.Text, nullable=True)
    chunk_index = db.Column(db.Integer, nullable=True, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Foreign key: A question belongs to one document
    document_id = db.Column(db.Integer, db.ForeignKey('document.id'), nullable=False)

    def __repr__(self):
        return f'<Question {self.id}: {self.question_text[:50]}...>'

    def to_dict(self):
        return {
            'id': self.id,
            'question_text': self.question_text,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation,
            'chunk_index': self.chunk_index,
            'document_id': self.document_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

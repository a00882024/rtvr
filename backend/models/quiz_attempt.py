from datetime import datetime, timezone
from database import db


class QuizAttempt(db.Model):
    """Model for storing quiz attempts on notebooks."""

    id = db.Column(db.Integer, primary_key=True)
    notebook_id = db.Column(db.Integer, db.ForeignKey('notebook.id'), nullable=False)
    score = db.Column(db.Integer, nullable=True)  # Null until quiz is completed
    total_questions = db.Column(db.Integer, nullable=False)
    started_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    answers = db.relationship('QuizAnswer', backref='quiz_attempt', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_answers=False):
        """Convert quiz attempt to dictionary."""
        result = {
            'id': self.id,
            'notebook_id': self.notebook_id,
            'score': self.score,
            'total_questions': self.total_questions,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'is_completed': self.completed_at is not None
        }

        if include_answers and self.answers:
            result['answers'] = [answer.to_dict(include_question=True) for answer in self.answers]

        return result

from datetime import datetime, timezone
from database import db


class QuizAnswer(db.Model):
    """Model for storing individual answers within a quiz attempt."""

    id = db.Column(db.Integer, primary_key=True)
    quiz_attempt_id = db.Column(db.Integer, db.ForeignKey('quiz_attempt.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    selected_answer = db.Column(db.String(1), nullable=False)  # 'A', 'B', 'C', or 'D'
    is_correct = db.Column(db.Boolean, nullable=False)
    answered_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    question = db.relationship('Question', backref='quiz_answers', lazy=True)

    def to_dict(self, include_question=False):
        """Convert quiz answer to dictionary."""
        result = {
            'id': self.id,
            'quiz_attempt_id': self.quiz_attempt_id,
            'question_id': self.question_id,
            'selected_answer': self.selected_answer,
            'is_correct': self.is_correct,
            'answered_at': self.answered_at.isoformat() if self.answered_at else None
        }

        if include_question and self.question:
            result['question'] = self.question.to_dict()

        return result

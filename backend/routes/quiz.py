from flask import Blueprint, jsonify, request
from datetime import datetime, timezone
from database import db
from models.notebook import Notebook
from models.question import Question
from models.quiz_attempt import QuizAttempt
from models.quiz_answer import QuizAnswer
import random

quiz_bp = Blueprint('quiz', __name__)


@quiz_bp.route('/notebooks/<int:notebook_id>/quiz/start', methods=['POST'])
def start_quiz(notebook_id):
    """
    Start a new quiz for a notebook.
    Selects random questions from all documents in the notebook.
    """
    # Verify notebook exists
    notebook = Notebook.query.get(notebook_id)
    if not notebook:
        return jsonify({'error': 'Notebook not found'}), 404

    # Get all questions from all documents in this notebook
    all_questions = []
    for document in notebook.documents:
        all_questions.extend(document.questions)

    if len(all_questions) == 0:
        return jsonify({'error': 'No questions available in this notebook'}), 400

    # Select random questions (up to 5, or all available if less than 5)
    num_questions = min(5, len(all_questions))
    selected_questions = random.sample(all_questions, num_questions)

    # Create quiz attempt
    quiz_attempt = QuizAttempt(
        notebook_id=notebook_id,
        total_questions=num_questions,
        score=None  # Will be calculated when quiz is completed
    )
    db.session.add(quiz_attempt)
    db.session.commit()

    # Return quiz attempt with selected questions
    return jsonify({
        'quiz_attempt': quiz_attempt.to_dict(),
        'questions': [q.to_dict() for q in selected_questions]
    }), 201


@quiz_bp.route('/notebooks/<int:notebook_id>/quiz/<int:attempt_id>/answer', methods=['POST'])
def submit_answer(notebook_id, attempt_id):
    """
    Submit an answer for a question in the quiz.
    """
    # Verify quiz attempt exists and belongs to this notebook
    quiz_attempt = QuizAttempt.query.get(attempt_id)
    if not quiz_attempt:
        return jsonify({'error': 'Quiz attempt not found'}), 404

    if quiz_attempt.notebook_id != notebook_id:
        return jsonify({'error': 'Quiz attempt does not belong to this notebook'}), 400

    if quiz_attempt.completed_at is not None:
        return jsonify({'error': 'Quiz has already been completed'}), 400

    # Get request data
    data = request.get_json()
    question_id = data.get('question_id')
    selected_answer = data.get('selected_answer')

    if not question_id or not selected_answer:
        return jsonify({'error': 'Missing required fields: question_id, selected_answer'}), 400

    if selected_answer not in ['A', 'B', 'C', 'D']:
        return jsonify({'error': 'Invalid answer. Must be A, B, C, or D'}), 400

    # Verify question exists
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'error': 'Question not found'}), 404

    # Check if answer already exists for this question in this attempt
    existing_answer = QuizAnswer.query.filter_by(
        quiz_attempt_id=attempt_id,
        question_id=question_id
    ).first()

    if existing_answer:
        return jsonify({'error': 'Answer already submitted for this question'}), 400

    # Check if answer is correct
    is_correct = (selected_answer.upper() == question.correct_answer.upper())

    # Create quiz answer
    quiz_answer = QuizAnswer(
        quiz_attempt_id=attempt_id,
        question_id=question_id,
        selected_answer=selected_answer.upper(),
        is_correct=is_correct
    )
    db.session.add(quiz_answer)
    db.session.commit()

    return jsonify({
        'answer': quiz_answer.to_dict(),
        'is_correct': is_correct
    }), 201


@quiz_bp.route('/notebooks/<int:notebook_id>/quiz/<int:attempt_id>/complete', methods=['POST'])
def complete_quiz(notebook_id, attempt_id):
    """
    Complete a quiz and calculate the final score.
    """
    # Verify quiz attempt exists and belongs to this notebook
    quiz_attempt = QuizAttempt.query.get(attempt_id)
    if not quiz_attempt:
        return jsonify({'error': 'Quiz attempt not found'}), 404

    if quiz_attempt.notebook_id != notebook_id:
        return jsonify({'error': 'Quiz attempt does not belong to this notebook'}), 400

    if quiz_attempt.completed_at is not None:
        return jsonify({'error': 'Quiz has already been completed'}), 400

    # Calculate score
    correct_answers = sum(1 for answer in quiz_attempt.answers if answer.is_correct)
    quiz_attempt.score = correct_answers
    quiz_attempt.completed_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({
        'quiz_attempt': quiz_attempt.to_dict(include_answers=True),
        'score': correct_answers,
        'total_questions': quiz_attempt.total_questions
    }), 200


@quiz_bp.route('/notebooks/<int:notebook_id>/quiz/<int:attempt_id>', methods=['GET'])
def get_quiz_attempt(notebook_id, attempt_id):
    """
    Get details of a specific quiz attempt, including all answers and questions.
    """
    # Verify quiz attempt exists and belongs to this notebook
    quiz_attempt = QuizAttempt.query.get(attempt_id)
    if not quiz_attempt:
        return jsonify({'error': 'Quiz attempt not found'}), 404

    if quiz_attempt.notebook_id != notebook_id:
        return jsonify({'error': 'Quiz attempt does not belong to this notebook'}), 400

    return jsonify(quiz_attempt.to_dict(include_answers=True)), 200


@quiz_bp.route('/notebooks/<int:notebook_id>/quiz/history', methods=['GET'])
def get_quiz_history(notebook_id):
    """
    Get all quiz attempts for a notebook, sorted by most recent first.
    """
    # Verify notebook exists
    notebook = Notebook.query.get(notebook_id)
    if not notebook:
        return jsonify({'error': 'Notebook not found'}), 404

    # Get all quiz attempts for this notebook
    quiz_attempts = QuizAttempt.query.filter_by(notebook_id=notebook_id)\
        .order_by(QuizAttempt.started_at.desc())\
        .all()

    return jsonify({
        'quiz_attempts': [attempt.to_dict() for attempt in quiz_attempts]
    }), 200

import { useLoaderData, useNavigate, useLocation } from "react-router";
import type { Route } from "./+types/notebooks.$id.quiz.$attemptId";
import { api, type Question } from "~/services/api";
import { useState, useEffect } from "react";

export async function loader({ params }: Route.LoaderArgs) {
  const notebookId = Number(params.id);
  const attemptId = Number(params.attemptId);

  return {
    notebookId,
    attemptId,
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Take Quiz - RTVR" },
    { name: "description", content: "Answer quiz questions" },
  ];
}

export default function QuizPage() {
  const { notebookId, attemptId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get questions from navigation state
  const questions = (location.state?.questions as Question[]) || [];
  const totalQuestions = questions.length;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect back if no questions found
  useEffect(() => {
    if (questions.length === 0) {
      navigate(`/notebooks/${notebookId}`);
    }
  }, [questions, notebookId, navigate]);

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswer(answer);
  };

  const handleNext = async () => {
    if (!selectedAnswer) {
      alert('Please select an answer');
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit answer
      await api.submitQuizAnswer(
        notebookId,
        attemptId,
        currentQuestion.id,
        selectedAnswer
      );

      if (isLastQuestion) {
        // Complete the quiz
        await api.completeQuiz(notebookId, attemptId);
        // Redirect to results
        navigate(`/notebooks/${notebookId}/quiz/${attemptId}/results`);
      } else {
        // Move to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionLabel = (option: 'A' | 'B' | 'C' | 'D') => {
    const optionMap: Record<'A' | 'B' | 'C' | 'D', keyof Question> = {
      A: 'option_a',
      B: 'option_b',
      C: 'option_c',
      D: 'option_d',
    };
    return currentQuestion[optionMap[option]] as string;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {currentQuestion.question_text}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    selectedAnswer === option
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {option}
                  </span>
                  <span className="ml-3 text-gray-900 dark:text-white flex-1">
                    {getOptionLabel(option)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={() => navigate(`/notebooks/${notebookId}`)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel Quiz
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedAnswer || isSubmitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? 'Submitting...'
                : isLastQuestion
                ? 'Finish Quiz'
                : 'Next Question'}
              {!isSubmitting && (
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

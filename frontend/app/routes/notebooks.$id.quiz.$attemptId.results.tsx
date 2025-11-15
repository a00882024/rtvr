import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/notebooks.$id.quiz.$attemptId.results";
import { api } from "~/services/api";

export async function loader({ params }: Route.LoaderArgs) {
  const notebookId = Number(params.id);
  const attemptId = Number(params.attemptId);

  const quizAttempt = await api.getQuizAttempt(notebookId, attemptId);

  return { notebookId, quizAttempt };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quiz Results - RTVR" },
    { name: "description", content: "View quiz results" },
  ];
}

export default function QuizResultsPage() {
  const { notebookId, quizAttempt } = useLoaderData<typeof loader>();

  const score = quizAttempt.score || 0;
  const totalQuestions = quizAttempt.total_questions;
  const percentage = Math.round((score / totalQuestions) * 100);

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = () => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Quiz Complete!
            </h1>
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor()} mb-4`}>
              <span className={`text-4xl font-bold ${getScoreColor()}`}>
                {percentage}%
              </span>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              You scored {score} out of {totalQuestions}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Completed on {new Date(quizAttempt.completed_at || '').toLocaleDateString()} at{' '}
              {new Date(quizAttempt.completed_at || '').toLocaleTimeString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Link
              to={`/notebooks/${notebookId}`}
              className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Notebook
            </Link>
            <Link
              to={`/notebooks/${notebookId}`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </Link>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Review Answers
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {quizAttempt.answers?.map((answer, index) => (
              <div
                key={answer.id}
                className={`p-6 rounded-lg border-2 ${
                  answer.is_correct
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Question {index + 1}
                      </span>
                      {answer.is_correct ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Incorrect
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {answer.question?.question_text}
                    </h3>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-2 mb-4">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => {
                    const isSelected = answer.selected_answer === option;
                    const isCorrect = answer.question?.correct_answer === option;
                    const optionKey = `option_${option.toLowerCase()}` as keyof typeof answer.question;
                    const optionText = answer.question?.[optionKey] as string;

                    return (
                      <div
                        key={option}
                        className={`p-3 rounded-lg flex items-start ${
                          isCorrect
                            ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                            : isSelected
                            ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                            : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs ${
                          isCorrect
                            ? 'bg-green-500 text-white'
                            : isSelected
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                        }`}>
                          {option}
                        </span>
                        <span className="ml-3 text-gray-900 dark:text-white flex-1">
                          {optionText}
                        </span>
                        {isCorrect && (
                          <svg
                            className="w-5 h-5 text-green-600 dark:text-green-400 ml-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {isSelected && !isCorrect && (
                          <svg
                            className="w-5 h-5 text-red-600 dark:text-red-400 ml-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {answer.question?.explanation && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                          Explanation
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          {answer.question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

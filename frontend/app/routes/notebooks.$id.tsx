import { Link, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/notebooks.$id";
import { api } from "~/services/api";
import { useState } from "react";

export async function loader({ params }: Route.LoaderArgs) {
  const notebookId = Number(params.id);
  const [notebook, quizHistory] = await Promise.all([
    api.getNotebook(notebookId, true),
    api.getQuizHistory(notebookId),
  ]);

  // Count total questions across all documents
  const totalQuestions = notebook.documents?.reduce(
    (sum, doc) => sum + (doc.questions?.length || 0),
    0
  ) || 0;

  return { notebook, quizHistory: quizHistory.quiz_attempts, totalQuestions };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Notebook - RTVR" },
    { name: "description", content: "View notebook details" },
  ];
}

const colorClasses: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

export default function NotebookDetailPage() {
  const { notebook, quizHistory, totalQuestions } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);

  const colorClass = notebook.color_tag
    ? colorClasses[notebook.color_tag] || "bg-gray-500"
    : "bg-gray-500";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteNotebook(notebook.id);
      navigate("/notebooks");
    } catch (error) {
      console.error("Failed to delete notebook:", error);
      alert("Failed to delete notebook. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleStartQuiz = async () => {
    setIsStartingQuiz(true);
    try {
      const response = await api.startQuiz(notebook.id);
      navigate(`/notebooks/${notebook.id}/quiz/${response.quiz_attempt.id}`, {
        state: { questions: response.questions }
      });
    } catch (error) {
      console.error("Failed to start quiz:", error);
      alert("Failed to start quiz. Please try again.");
      setIsStartingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/notebooks"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Notebooks
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className={`h-3 ${colorClass}`}></div>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {notebook.title}
                    </h1>
                    {notebook.visibility === 1 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Private
                      </span>
                    )}
                  </div>
                  {notebook.description && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {notebook.description}
                    </p>
                  )}
                  {notebook.subject && (
                    <span className="inline-block mt-3 px-3 py-1 text-sm font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {notebook.subject}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    to={`/notebooks/${notebook.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Section */}
        {totalQuestions > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Quiz
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} available
                  </p>
                </div>
                <button
                  onClick={handleStartQuiz}
                  disabled={isStartingQuiz}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  {isStartingQuiz ? 'Starting...' : 'Take Quiz'}
                </button>
              </div>

              {/* Quiz History */}
              {quizHistory.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Recent Attempts
                  </h3>
                  <div className="space-y-2">
                    {quizHistory.map((attempt) => (
                      <Link
                        key={attempt.id}
                        to={`/notebooks/${notebook.id}/quiz/${attempt.id}/results`}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            attempt.score !== undefined && attempt.score / attempt.total_questions >= 0.8
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : attempt.score !== undefined && attempt.score / attempt.total_questions >= 0.6
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            <span className="text-sm font-semibold">
                              {attempt.score !== undefined ? `${attempt.score}/${attempt.total_questions}` : '-'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {attempt.score !== undefined
                                ? `${Math.round((attempt.score / attempt.total_questions) * 100)}%`
                                : 'In Progress'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(attempt.started_at).toLocaleDateString()} at{' '}
                              {new Date(attempt.started_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Documents ({notebook.documents?.length || 0})
              </h2>
              <Link
                to={`/notebooks/${notebook.id}/documents/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Document
              </Link>
            </div>
          </div>
          <div className="p-6">
            {!notebook.documents || notebook.documents.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No documents
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by adding a document to this notebook.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notebook.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.title}
                        </h3>
                        {doc.processed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            Processed
                          </span>
                        )}
                      </div>
                      {doc.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                          {doc.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{doc.file_name}</span>
                        <span>{doc.file_type.toUpperCase()}</span>
                        <span>
                          {(doc.file_size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/documents/${doc.id}`}
                      className="ml-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Delete Notebook
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{notebook.title}"? This will also
              delete all {notebook.document_count} document(s) in this notebook.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

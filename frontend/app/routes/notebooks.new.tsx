import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/notebooks.new";
import { api } from "~/services/api";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New Notebook - RTVR" },
    { name: "description", content: "Create a new notebook" },
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

function ColorRadio({ color, name, defaultChecked }: { color: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="relative cursor-pointer">
      <input
        type="radio"
        name={name}
        value={color}
        defaultChecked={defaultChecked}
        className="sr-only peer"
      />
      <div
        className={`w-10 h-10 rounded-full ${colorClasses[color]} ring-2 ring-transparent peer-checked:ring-gray-900 dark:peer-checked:ring-white peer-checked:ring-offset-2 transition-all`}
        title={color}
      />
    </label>
  );
}

export default function NewNotebookPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      visibility: formData.get("visibility") === "private" ? 1 : 0,
      subject: formData.get("subject") as string || undefined,
      color_tag: formData.get("color_tag") as string || undefined,
      document_count: 0,
    };

    try {
      const notebook = await api.createNotebook(data);
      navigate(`/notebooks/${notebook.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create notebook");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Notebook
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Organize your documents into a notebook
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                placeholder="Enter notebook title"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                placeholder="Enter notebook description"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Subject
              </label>
              <input
                type="text"
                name="subject"
                id="subject"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                placeholder="e.g., Mathematics, Science, History"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color Tag
              </label>
              <div className="grid grid-cols-9 gap-2">
                <ColorRadio color="red" name="color_tag" />
                <ColorRadio color="orange" name="color_tag" />
                <ColorRadio color="yellow" name="color_tag" />
                <ColorRadio color="green" name="color_tag" />
                <ColorRadio color="teal" name="color_tag" />
                <ColorRadio color="blue" name="color_tag" />
                <ColorRadio color="indigo" name="color_tag" />
                <ColorRadio color="purple" name="color_tag" />
                <ColorRadio color="pink" name="color_tag" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    defaultChecked
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Public
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Anyone can view this notebook
                    </div>
                  </div>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Private
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Only you can view this notebook
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/notebooks"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Notebook"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

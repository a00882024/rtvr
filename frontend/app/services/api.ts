const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export interface Notebook {
  id: number;
  title: string;
  description?: string;
  visibility: number;
  subject?: string;
  color_tag?: string;
  document_count: number;
  created_at?: string;
  updated_at?: string;
  documents?: Document[];
}

export interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  chunk_index?: number;
  document_id: number;
  created_at?: string;
}

export interface QuizAttempt {
  id: number;
  notebook_id: number;
  score?: number;
  total_questions: number;
  started_at: string;
  completed_at?: string;
  is_completed: boolean;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: number;
  quiz_attempt_id: number;
  question_id: number;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  answered_at: string;
  question?: Question;
}

export interface StartQuizResponse {
  quiz_attempt: QuizAttempt;
  questions: Question[];
}

export interface SubmitAnswerResponse {
  answer: QuizAnswer;
  is_correct: boolean;
}

export interface CompleteQuizResponse {
  quiz_attempt: QuizAttempt;
  score: number;
  total_questions: number;
}

export interface QuizHistoryResponse {
  quiz_attempts: QuizAttempt[];
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  extracted_content: string;
  file_name: string;
  file_type: string;
  file_size: number;
  processed: boolean;
  summary?: string;
  questions?: Question[];
  notebook_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateNotebookData {
  title: string;
  description?: string;
  visibility?: number;
  subject?: string;
  color_tag?: string;
  document_count?: number;
}

export interface UpdateNotebookData extends Partial<CreateNotebookData> {}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetchJson<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Notebooks API
  async getNotebooks(): Promise<Notebook[]> {
    return this.fetchJson<Notebook[]>('/v1/notebooks');
  }

  async getNotebook(id: number, includeDocuments = false): Promise<Notebook> {
    const query = includeDocuments ? '?include_documents=true' : '';
    return this.fetchJson<Notebook>(`/v1/notebooks/${id}${query}`);
  }

  async createNotebook(data: CreateNotebookData): Promise<Notebook> {
    return this.fetchJson<Notebook>('/v1/notebooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNotebook(id: number, data: UpdateNotebookData): Promise<Notebook> {
    return this.fetchJson<Notebook>(`/v1/notebooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNotebook(id: number): Promise<{ message: string }> {
    return this.fetchJson<{ message: string }>(`/v1/notebooks/${id}`, {
      method: 'DELETE',
    });
  }

  async getNotebookDocuments(notebookId: number): Promise<Document[]> {
    return this.fetchJson<Document[]>(`/v1/notebooks/${notebookId}/documents`);
  }

  // Documents API
  async getDocuments(): Promise<Document[]> {
    return this.fetchJson<Document[]>('/v1/documents');
  }

  async getDocument(id: number): Promise<Document> {
    return this.fetchJson<Document>(`/v1/documents/${id}`);
  }

  async createDocument(data: FormData): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/v1/documents`, {
      method: 'POST',
      body: data,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async updateDocument(id: number, data: Partial<Document>): Promise<Document> {
    return this.fetchJson<Document>(`/v1/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: number): Promise<{ message: string }> {
    return this.fetchJson<{ message: string }>(`/v1/documents/${id}`, {
      method: 'DELETE',
    });
  }

  async generateDocumentSummary(id: number): Promise<Document> {
    return this.fetchJson<Document>(`/v1/documents/${id}/summary`, {
      method: 'POST',
    });
  }

  async generateDocumentQuestions(
    id: number,
    numQuestions: number = 5,
    regenerate: boolean = false
  ): Promise<Document> {
    const params = new URLSearchParams();
    params.append('num_questions', numQuestions.toString());
    params.append('regenerate', regenerate.toString());

    return this.fetchJson<Document>(
      `/v1/documents/${id}/questions?${params.toString()}`,
      {
        method: 'POST',
      }
    );
  }

  async getDocumentQuestions(id: number): Promise<Question[]> {
    return this.fetchJson<Question[]>(`/v1/documents/${id}/questions`);
  }

  // Quiz API
  async startQuiz(notebookId: number): Promise<StartQuizResponse> {
    return this.fetchJson<StartQuizResponse>(
      `/v1/notebooks/${notebookId}/quiz/start`,
      {
        method: 'POST',
      }
    );
  }

  async submitQuizAnswer(
    notebookId: number,
    attemptId: number,
    questionId: number,
    selectedAnswer: 'A' | 'B' | 'C' | 'D'
  ): Promise<SubmitAnswerResponse> {
    return this.fetchJson<SubmitAnswerResponse>(
      `/v1/notebooks/${notebookId}/quiz/${attemptId}/answer`,
      {
        method: 'POST',
        body: JSON.stringify({
          question_id: questionId,
          selected_answer: selectedAnswer,
        }),
      }
    );
  }

  async completeQuiz(
    notebookId: number,
    attemptId: number
  ): Promise<CompleteQuizResponse> {
    return this.fetchJson<CompleteQuizResponse>(
      `/v1/notebooks/${notebookId}/quiz/${attemptId}/complete`,
      {
        method: 'POST',
      }
    );
  }

  async getQuizAttempt(
    notebookId: number,
    attemptId: number
  ): Promise<QuizAttempt> {
    return this.fetchJson<QuizAttempt>(
      `/v1/notebooks/${notebookId}/quiz/${attemptId}`
    );
  }

  async getQuizHistory(notebookId: number): Promise<QuizHistoryResponse> {
    return this.fetchJson<QuizHistoryResponse>(
      `/v1/notebooks/${notebookId}/quiz/history`
    );
  }
}

export const api = new ApiService();

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

export interface Document {
  id: number;
  title: string;
  description?: string;
  extracted_content: string;
  file_name: string;
  file_type: string;
  file_size: number;
  processed: boolean;
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
}

export const api = new ApiService();

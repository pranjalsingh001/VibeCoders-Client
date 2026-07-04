import { useAuthStore } from '@/lib/stores/auth-store';

const API_BASE = 'http://localhost:5000/api/v1';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const { token } = useAuthStore.getState();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new APIError(response.status, errorData.message || 'An error occurred');
  }
  
  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {};
  }
  
  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (data: { email: string; password: string }) =>
      apiCall('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

    signup: (data: { username: string; email: string; password: string }) =>
      apiCall('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

    me: () => apiCall('/auth/me'),
  },

  // Projects
  projects: {
    list: () => apiCall('/projects'),
    get: (id: string) => apiCall(`/projects/${id}`),
    create: (data: { name: string; description: string }) =>
      apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: data.name, idea: data.description }),
      }),
  },

  // Workflow (nested under projects)
  workflow: {
    getStatus: (projectId: string) => apiCall(`/projects/${projectId}/workflow/status`),
    next: (projectId: string, data?: any) =>
      apiCall(`/projects/${projectId}/workflow/next`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    reset: (projectId: string) =>
      apiCall(`/projects/${projectId}/workflow/reset`, { method: 'POST', body: JSON.stringify({}) }),
  },

  // Planning
  planning: {
    clarify: (data: { projectId: string; projectName?: string; ideaDescription?: string }) =>
      apiCall('/planning/clarify', { method: 'POST', body: JSON.stringify(data) }),
    submitAnswers: (data: { projectId: string; answers: any[] }) =>
      apiCall('/planning/clarify/answer', { method: 'POST', body: JSON.stringify(data) }),
    getDocs: (projectId: string) => apiCall(`/planning/docs?projectId=${projectId}`),
  },

  // Files
  files: {
    list: (projectId: string, dir?: string, recursive?: boolean) =>
      apiCall(`/files/list?projectId=${projectId}${dir ? `&dir=${encodeURIComponent(dir)}` : ''}${recursive ? '&recursive=true' : ''}`),
    read: (projectId: string, relativePath: string) =>
      apiCall(`/files/read?projectId=${projectId}&relativePath=${encodeURIComponent(relativePath)}`),
    write: (data: { projectId: string; relativePath: string; content: string }) =>
      apiCall('/files/write', { method: 'POST', body: JSON.stringify(data) }),
  },
};


export { APIError };

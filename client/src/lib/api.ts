import { useAuthStore } from '@/lib/stores/auth-store';

const API_BASE = '';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
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
      apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    signup: (data: { username: string; email: string; password: string }) =>
      apiCall('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  // Projects
  projects: {
    list: () => apiCall('/api/projects'),
    
    get: (id: string) => apiCall(`/api/projects/${id}`),
    
    create: (data: { name: string; description: string }) =>
      apiCall('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  // Workflow
  workflow: {
    getStatus: (projectId: string) => apiCall(`/api/workflow/${projectId}/status`),
    
    next: (projectId: string, data: any) =>
      apiCall(`/api/workflow/${projectId}/next`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  // AI Stages
  planning: (data: { projectId: string; answers: any[] }) =>
    apiCall('/api/planning', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  blueprint: (data: { projectId: string; blueprint: any }) =>
    apiCall('/api/blueprint', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  design: {
    hld: (data: { projectId: string; hld: any }) =>
      apiCall('/api/design/hld', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    lld: (data: { projectId: string; lld: any }) =>
      apiCall('/api/design/lld', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  codegen: (data: { projectId: string; codegenPlan: any }) =>
    apiCall('/api/codegen', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Files
  files: {
    list: (projectId: string) => apiCall(`/api/files/${projectId}`),
    
    create: (data: { projectId: string; path: string; content: string; language?: string }) =>
      apiCall('/api/files', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export { APIError };

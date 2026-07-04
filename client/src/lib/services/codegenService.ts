import { apiCall } from '../api';

export const codegenAPI = {
  // Create file manifest with validation against blueprint/HLD/LLD
  createManifest: async (projectId: string, context: any = {}): Promise<any> => {
    return await apiCall('/codegen/manifest/create', {
      method: 'POST',
      body: JSON.stringify({ projectId, context }),
    });
  },

  // Get current manifest for a project
  getManifest: async (projectId: string): Promise<any> => {
    return await apiCall(`/codegen/manifest/${projectId}`);
  },

  // Validate manifest against design requirements
  validateManifest: async (projectId: string, manifestId: string): Promise<any> => {
    return await apiCall('/codegen/manifest/validate', {
      method: 'POST',
      body: JSON.stringify({ projectId, manifestId }),
    });
  },

  // Start generation based on manifest
  startGeneration: async (projectId: string, options: any): Promise<any> => {
    return await apiCall('/codegen/generate/start', {
      method: 'POST',
      body: JSON.stringify({ projectId, ...options }),
    });
  },

  // Get real-time progress
  getProgress: async (projectId: string): Promise<any> => {
    return await apiCall(`/codegen/progress/${projectId}`);
  },

  // Retry specific file generation
  retryFile: async (projectId: string, filePath: string, options?: any): Promise<any> => {
    return await apiCall('/codegen/retry/file', {
      method: 'POST',
      body: JSON.stringify({ projectId, filePath, ...options }),
    });
  },

  // Bulk retry failed files
  retryFailedFiles: async (projectId: string, options?: any): Promise<any> => {
    return await apiCall('/codegen/retry/bulk', {
      method: 'POST',
      body: JSON.stringify({ projectId, ...options }),
    });
  },

  // Generate specific file with context
  generateFile: async (projectId: string, request: any): Promise<any> => {
    return await apiCall('/codegen/generate/file', {
      method: 'POST',
      body: JSON.stringify({ projectId, ...request }),
    });
  },

  // Stop ongoing generation
  stopGeneration: async (projectId: string): Promise<any> => {
    return await apiCall('/codegen/generate/stop', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  },

  // Create a code generation plan
  createPlan: async (projectId: string): Promise<any> => {
    return await apiCall('/codegen/plan', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  },

  // Apply plan
  applyPlan: async (projectId: string, options: any = {}): Promise<any> => {
    return await apiCall('/codegen/apply', {
      method: 'POST',
      body: JSON.stringify({ projectId, ...options }),
    });
  },

  getStatus: async (projectId: string): Promise<any> => {
    return await apiCall(`/codegen/status?projectId=${projectId}`);
  },
};

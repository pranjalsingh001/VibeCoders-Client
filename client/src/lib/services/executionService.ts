import { apiCall } from '../api';

export const executionAPI = {
  // Start a new session for a project
  start: async (projectId: string) => {
    return await apiCall(`/projects/${projectId}/session/start`, { method: 'POST' });
  },

  // Stop the active session for a project
  stop: async (projectId: string) => {
    return await apiCall(`/projects/${projectId}/session/stop`, { method: 'POST' });
  },

  // Get the current session status
  status: async (projectId: string) => {
    return await apiCall(`/projects/${projectId}/session/status`);
  }
};

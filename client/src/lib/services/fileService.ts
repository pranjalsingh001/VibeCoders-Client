import { apiCall } from '../api';

export type FileEntry = {
  name: string;
  type: 'file' | 'dir';
};

export const fileService = {
  list: async (projectId: string, dir: string = '/'): Promise<FileEntry[]> => {
    try {
      const data = await apiCall(`/files/list?projectId=${projectId}&dir=${encodeURIComponent(dir)}`);
      const payload = data.data || data;
      return payload?.entries ?? payload ?? [];
    } catch (err: any) {
      console.error('[File List Error]', err);
      throw new Error(err.message || 'Failed to list files');
    }
  },

  read: async (projectId: string, relativePath: string): Promise<string> => {
    try {
      const data = await apiCall(`/files/read?projectId=${projectId}&relativePath=${encodeURIComponent(relativePath)}`);
      const payload = data.data || data;
      return payload.content;
    } catch (err: any) {
      console.error('[File Read Error]', err);
      throw new Error(err.message || 'Failed to read file');
    }
  },

  write: async (projectId: string, relativePath: string, content: string): Promise<void> => {
    try {
      await apiCall('/files/write', {
        method: 'POST',
        body: JSON.stringify({ projectId, relativePath, content }),
      });
    } catch (err: any) {
      console.error('[File Write Error]', err);
      throw new Error(err.message || 'Failed to write file');
    }
  },

  createFolder: async (projectId: string, relativePath: string): Promise<void> => {
    try {
      await apiCall('/files/create-folder', {
        method: 'POST',
        body: JSON.stringify({ projectId, relativePath }),
      });
    } catch (err: any) {
      console.error('[Create Folder Error]', err);
      throw new Error(err.message || 'Failed to create folder');
    }
  },

  delete: async (projectId: string, relativePath: string): Promise<void> => {
    try {
      await apiCall(`/files/delete?projectId=${projectId}&relativePath=${encodeURIComponent(relativePath)}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      console.error('[File Delete Error]', err);
      throw new Error(err.message || 'Failed to delete file');
    }
  }
};

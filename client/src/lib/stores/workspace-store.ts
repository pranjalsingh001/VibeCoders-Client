import { create } from 'zustand';
import type { ProjectFile } from '@shared/schema';

interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  isOpen?: boolean;
}

interface WorkspaceState {
  files: Map<string, ProjectFile[]>;
  openTabs: Map<string, ProjectFile[]>;
  activeFile: ProjectFile | null;
  fileTree: Map<string, FileTreeNode[]>;
  
  setFiles: (projectId: string, files: ProjectFile[]) => void;
  openFile: (projectId: string, file: ProjectFile) => void;
  closeFile: (projectId: string, fileId: string) => void;
  setActiveFile: (file: ProjectFile | null) => void;
  updateFileContent: (fileId: string, content: string) => void;
  buildFileTree: (projectId: string, files: ProjectFile[]) => void;
  toggleFolder: (projectId: string, folderPath: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  files: new Map(),
  openTabs: new Map(),
  activeFile: null,
  fileTree: new Map(),
  
  setFiles: (projectId: string, files: ProjectFile[]) => {
    const filesMap = new Map(get().files);
    filesMap.set(projectId, files);
    set({ files: filesMap });
    get().buildFileTree(projectId, files);
  },
  
  openFile: (projectId: string, file: ProjectFile) => {
    const openTabs = new Map(get().openTabs);
    const currentTabs = openTabs.get(projectId) || [];
    
    // Don't add if already open
    if (!currentTabs.find(tab => tab.id === file.id)) {
      currentTabs.push(file);
      openTabs.set(projectId, currentTabs);
      set({ openTabs });
    }
    
    set({ activeFile: file });
  },
  
  closeFile: (projectId: string, fileId: string) => {
    const openTabs = new Map(get().openTabs);
    const currentTabs = openTabs.get(projectId) || [];
    const filteredTabs = currentTabs.filter(tab => tab.id !== fileId);
    openTabs.set(projectId, filteredTabs);
    
    // If closing active file, set new active file
    const { activeFile } = get();
    if (activeFile?.id === fileId) {
      const newActiveFile = filteredTabs.length > 0 ? filteredTabs[filteredTabs.length - 1] : null;
      set({ openTabs, activeFile: newActiveFile });
    } else {
      set({ openTabs });
    }
  },
  
  setActiveFile: (file: ProjectFile | null) => {
    set({ activeFile: file });
  },
  
  updateFileContent: (fileId: string, content: string) => {
    const { activeFile } = get();
    if (activeFile?.id === fileId) {
      set({ activeFile: { ...activeFile, content } });
    }
  },
  
  buildFileTree: (projectId: string, files: ProjectFile[]) => {
    const tree: FileTreeNode[] = [];
    const pathMap = new Map<string, FileTreeNode>();
    
    // Sort files by path
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
    
    for (const file of sortedFiles) {
      const parts = file.path.split('/').filter(Boolean);
      let currentPath = '';
      let currentLevel = tree;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath += (currentPath ? '/' : '') + part;
        const isFile = i === parts.length - 1;
        
        let node = pathMap.get(currentPath);
        if (!node) {
          node = {
            id: isFile ? file.id : currentPath,
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : [],
            isOpen: false,
          };
          pathMap.set(currentPath, node);
          currentLevel.push(node);
        }
        
        if (!isFile && node.children) {
          currentLevel = node.children;
        }
      }
    }
    
    const fileTree = new Map(get().fileTree);
    fileTree.set(projectId, tree);
    set({ fileTree });
  },
  
  toggleFolder: (projectId: string, folderPath: string) => {
    const fileTree = new Map(get().fileTree);
    const tree = fileTree.get(projectId);
    if (!tree) return;
    
    const toggleNode = (nodes: FileTreeNode[]): boolean => {
      for (const node of nodes) {
        if (node.path === folderPath && node.type === 'folder') {
          node.isOpen = !node.isOpen;
          return true;
        }
        if (node.children && toggleNode(node.children)) {
          return true;
        }
      }
      return false;
    };
    
    if (toggleNode(tree)) {
      fileTree.set(projectId, [...tree]);
      set({ fileTree });
    }
  },
}));

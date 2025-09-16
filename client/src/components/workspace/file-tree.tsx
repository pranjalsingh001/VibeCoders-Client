import { useState } from 'react';
import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/lib/stores/workspace-store';
import type { ProjectFile } from '@shared/schema';

interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  isOpen?: boolean;
}

interface FileTreeProps {
  projectId: string;
  files: FileTreeNode[];
  onFileSelect: (file: ProjectFile) => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
      return '📄';
    case 'ts':
    case 'tsx':
      return '🔷';
    case 'css':
      return '🎨';
    case 'html':
      return '🌐';
    case 'json':
      return '⚙️';
    case 'md':
      return '📝';
    case 'py':
      return '🐍';
    default:
      return '📄';
  }
};

const getLanguageFromExtension = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    default:
      return 'plaintext';
  }
};

function FileTreeItem({ 
  node, 
  projectId, 
  onFileSelect, 
  level = 0 
}: { 
  node: FileTreeNode; 
  projectId: string; 
  onFileSelect: (file: ProjectFile) => void;
  level?: number;
}) {
  const { toggleFolder } = useWorkspaceStore();
  const [isExpanded, setIsExpanded] = useState(node.isOpen || false);

  const handleClick = () => {
    if (node.type === 'folder') {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      toggleFolder(projectId, node.path);
    } else {
      // Create a ProjectFile object for the selected file
      const projectFile: ProjectFile = {
        id: node.id,
        projectId,
        path: node.path,
        content: '', // Will be loaded when needed
        language: getLanguageFromExtension(node.name),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onFileSelect(projectFile);
    }
  };

  const iconColor = node.type === 'folder' ? 
    (isExpanded ? 'text-blue-400' : 'text-blue-600') : 
    'text-muted-foreground';

  return (
    <div>
      <div
        className={cn(
          "flex items-center space-x-2 px-2 py-1 rounded cursor-pointer hover:bg-secondary/50 transition-colors",
          node.type === 'file' && "hover:bg-secondary"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        data-testid={`file-tree-${node.type}-${node.path.replace(/[\/\.]/g, '-')}`}
      >
        {node.type === 'folder' && (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className={cn("w-4 h-4", iconColor)} />
            ) : (
              <Folder className={cn("w-4 h-4", iconColor)} />
            )}
          </>
        )}
        
        {node.type === 'file' && (
          <>
            <div className="w-3 h-3" />
            <File className="w-4 h-4 text-muted-foreground" />
          </>
        )}
        
        <span className={cn(
          "text-sm font-mono truncate",
          node.type === 'folder' ? "font-medium" : "text-muted-foreground"
        )}>
          {node.name}
        </span>
        
        {node.type === 'file' && (
          <span className="text-xs ml-1">
            {getFileIcon(node.name)}
          </span>
        )}
      </div>
      
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              projectId={projectId}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ projectId, files, onFileSelect }: FileTreeProps) {
  if (!files || files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
          <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files yet</p>
          <p className="text-xs">Files will appear here when generated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
      <div className="space-y-1">
        {/* Project Root */}
        <div className="flex items-center space-x-2 p-2 font-medium text-ai border-b border-border mb-2">
          <Folder className="w-4 h-4" />
          <span className="text-sm" data-testid="project-root">
            {projectId.slice(0, 8)}...
          </span>
        </div>

        {/* File Tree */}
        {files.map((node) => (
          <FileTreeItem
            key={node.id}
            node={node}
            projectId={projectId}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
}

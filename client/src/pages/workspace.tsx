import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, Play, Square, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores/workspace-store';
import { FileTree } from '@/components/workspace/file-tree';
import { MonacoEditor } from '@/components/workspace/monaco-editor';
import { LivePreview } from '@/components/workspace/live-preview';
import type { ProjectFile } from '@shared/schema';

export default function WorkspacePage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = params.projectId as string;
  const [isRunning, setIsRunning] = useState(false);

  const {
    files,
    openTabs,
    activeFile,
    fileTree,
    setFiles,
    openFile,
    closeFile,
    setActiveFile,
    buildFileTree,
  } = useWorkspaceStore();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: () => api.projects.get(projectId),
    enabled: !!projectId,
  });

  const { data: projectFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['/api/files', projectId],
    queryFn: () => api.files.list(projectId),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (projectFiles.length > 0) {
      setFiles(projectId, projectFiles);
    }
  }, [projectFiles, projectId, setFiles]);

  const currentTabs = openTabs.get(projectId) || [];
  const currentFileTree = fileTree.get(projectId) || [];

  const handleFileSelect = (file: ProjectFile) => {
    openFile(projectId, file);
  };

  const handleTabClose = (fileId: string) => {
    closeFile(projectId, fileId);
  };

  const handleTabChange = (fileId: string) => {
    const file = currentTabs.find(tab => tab.id === fileId);
    if (file) {
      setActiveFile(file);
    }
  };

  const handleRunProject = () => {
    setIsRunning(!isRunning);
  };

  if (projectLoading || filesLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 bg-card border-r border-border animate-pulse">
          <div className="p-4 space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-6 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 animate-pulse">
          <div className="h-12 bg-muted border-b"></div>
          <div className="flex-1 bg-muted/10"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <ResizablePanelGroup direction="horizontal">
        {/* File Explorer Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full bg-card border-r border-border flex flex-col">
            {/* Explorer Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation(`/workflow/${projectId}`)}
                  data-testid="button-back-workflow"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="font-medium">Explorer</h2>
                <Button variant="ghost" size="sm" data-testid="button-refresh-files">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* File Tree */}
            <FileTree
              projectId={projectId}
              files={currentFileTree}
              onFileSelect={handleFileSelect}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Editor Area */}
        <ResizablePanel defaultSize={55}>
          <div className="h-full flex flex-col">
            {/* Editor Tabs */}
            {currentTabs.length > 0 && (
              <div className="bg-card border-b border-border">
                <Tabs 
                  value={activeFile?.id || ''} 
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsList className="h-auto p-0 bg-transparent">
                    <div className="flex items-center overflow-x-auto">
                      {currentTabs.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="relative flex items-center space-x-2 px-4 py-2 border-r border-border data-[state=active]:bg-secondary"
                          data-testid={`tab-${tab.id}`}
                        >
                          <span className="text-sm font-mono">{tab.path.split('/').pop()}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTabClose(tab.id);
                            }}
                            data-testid={`close-tab-${tab.id}`}
                          >
                            ×
                          </Button>
                        </TabsTrigger>
                      ))}
                    </div>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Monaco Editor */}
            <div className="flex-1">
              {activeFile ? (
                <MonacoEditor
                  file={activeFile}
                  onChange={(content) => {
                    // Handle file content changes
                    console.log('File content changed:', content);
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No file selected</h3>
                    <p className="text-sm">Select a file from the explorer to start editing</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel: Live Preview & Logs */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full bg-card border-l border-border flex flex-col">
            {/* Panel Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Application</h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm"
                    variant={isRunning ? "destructive" : "default"}
                    onClick={handleRunProject}
                    data-testid="button-run-project"
                  >
                    {isRunning ? (
                      <>
                        <Square className="w-3 h-3 mr-1" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <LivePreview
              projectId={projectId}
              projectName={project?.name || 'Project'}
              isRunning={isRunning}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

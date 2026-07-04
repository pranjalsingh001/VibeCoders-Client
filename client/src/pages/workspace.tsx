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

// IDE Components
import XTerminal from '@/components/workspace/terminal';
import { CompactLogStream } from '@/components/workspace/log-stream';
import { WebSocketStatusIndicator } from '@/components/workspace/websocket-status';
import { useExecutionLogs } from '@/hooks/use-websocket';
import { executionAPI } from '@/lib/services/executionService';

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    default:
      return 'plaintext';
  }
}

export default function WorkspacePage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = params.projectId as string;
  const [isRunning, setIsRunning] = useState(false);

  // IDE State
  const [session, setSession] = useState<any | null>(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

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

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['/projects', projectId],
    queryFn: () => api.projects.get(projectId),
    enabled: !!projectId && projectId !== 'undefined',
  });
  const project = projectData?.project || projectData;

  // Load files recursively from the backend filesystem
  const { data: fileEntries = [], isLoading: filesLoading } = useQuery({
    queryKey: ['/files/list', projectId],
    queryFn: async () => {
      const result = await api.files.list(projectId, undefined, true);
      const entries = result?.entries || [];
      // Convert backend entries {name, type} into ProjectFile-like objects
      return entries.map((entry: any, idx: number) => ({
        id: `${projectId}-${entry.name}-${idx}`,
        projectId,
        path: entry.name,
        content: '',
        language: entry.type === 'dir' ? undefined : getLanguageFromPath(entry.name),
        isDirectory: entry.type === 'dir',
      }));
    },
    enabled: !!projectId && projectId !== 'undefined',
  });

  useEffect(() => {
    if (fileEntries.length > 0) {
      setFiles(projectId, fileEntries);
    }
  }, [fileEntries, projectId, setFiles]);

  useExecutionLogs(projectId, (log) => {
    setTerminalLogs(prev => [...prev, log.message]);
  });

  const currentTabs = openTabs.get(projectId) || [];
  const currentFileTree = fileTree.get(projectId) || [];

  const handleFileSelect = async (file: ProjectFile) => {
    if ((file as any).isDirectory) return;
    try {
      const res = await api.files.read(projectId, file.path);
      const content = res.content || '';
      openFile(projectId, { ...file, content });
    } catch (err) {
      console.error('Failed to read file:', err);
    }
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

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await executionAPI.start(projectId);
      setSession(res);
      setIsRunning(true);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await executionAPI.stop(projectId);
      setSession(null);
      setIsRunning(false);
    } catch (err) {
      console.error(err);
    } finally {
      setStopping(false);
    }
  };

  const handleRunProject = () => {
    if (isRunning) {
      handleStop();
    } else {
      handleStart();
    }
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
                <div className="flex items-center space-x-2">
                  <h2 className="font-medium">Explorer</h2>
                  <WebSocketStatusIndicator projectId={projectId} />
                </div>
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
                  projectId={projectId}
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
            <Tabs defaultValue="preview" className="h-full flex flex-col">
              <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                <TabsList className="bg-transparent p-0">
                  <TabsTrigger value="preview" className="data-[state=active]:bg-secondary">Preview</TabsTrigger>
                  <TabsTrigger value="terminal" className="data-[state=active]:bg-secondary">Terminal</TabsTrigger>
                </TabsList>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm"
                    variant={isRunning ? "destructive" : "default"}
                    onClick={handleRunProject}
                    data-testid="button-run-project"
                    disabled={starting || stopping}
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

              <TabsContent value="preview" className="flex-1 m-0 p-0 overflow-hidden flex flex-col">
                <LivePreview
                  projectId={projectId}
                  projectName={project?.name || 'Project'}
                  isRunning={isRunning}
                  sessionUrl={session?.url}
                />
              </TabsContent>

              <TabsContent value="terminal" className="flex-1 m-0 p-0 flex flex-col">
                <div className="flex-1 overflow-hidden min-h-[300px]">
                  <XTerminal
                    logs={terminalLogs}
                    onStart={handleStart}
                    onStop={handleStop}
                    session={session}
                    starting={starting}
                    stopping={stopping}
                  />
                </div>
                <div className="h-48 border-t border-border">
                  <CompactLogStream projectId={projectId} className="h-full border-none rounded-none" />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

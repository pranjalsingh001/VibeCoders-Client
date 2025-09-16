import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Globe, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LivePreviewProps {
  projectId: string;
  projectName: string;
  isRunning: boolean;
}

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

export function LivePreview({ projectId, projectName, isRunning }: LivePreviewProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [previewUrl, setPreviewUrl] = useState('http://localhost:3000');

  useEffect(() => {
    if (isRunning) {
      // Simulate server startup logs
      const startupLogs: LogEntry[] = [
        {
          id: '1',
          level: 'info',
          message: 'Starting development server...',
          timestamp: new Date(),
        },
        {
          id: '2',
          level: 'success',
          message: 'Server started on port 3001',
          timestamp: new Date(Date.now() + 1000),
        },
        {
          id: '3',
          level: 'info',
          message: 'Connected to MongoDB',
          timestamp: new Date(Date.now() + 2000),
        },
        {
          id: '4',
          level: 'warn',
          message: 'JWT secret loaded from environment',
          timestamp: new Date(Date.now() + 3000),
        },
        {
          id: '5',
          level: 'success',
          message: 'Client build successful',
          timestamp: new Date(Date.now() + 4000),
        },
      ];

      // Add logs with delay to simulate real startup
      startupLogs.forEach((log, index) => {
        setTimeout(() => {
          setLogs(prev => [...prev, log]);
        }, index * 1000);
      });
    } else {
      setLogs([]);
    }
  }, [isRunning]);

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'warn':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const getLogPrefix = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return '[SUCCESS]';
      case 'warn':
        return '[WARN]';
      case 'error':
        return '[ERROR]';
      default:
        return '[INFO]';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Tabs defaultValue="preview" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview" data-testid="tab-preview">Preview</TabsTrigger>
          <TabsTrigger value="console" data-testid="tab-console">Console</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 flex flex-col mt-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Live Preview</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className={`text-xs ${isRunning ? 'text-green-400' : 'text-gray-400'}`}>
                  {isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
            
            {isRunning && (
              <div className="flex items-center space-x-2">
                <div className="bg-muted/30 rounded border border-border p-2 text-xs font-mono flex-1">
                  {previewUrl}
                </div>
                <Button variant="ghost" size="sm" data-testid="button-refresh-preview">
                  <RefreshCw className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" data-testid="button-open-external">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Preview Content */}
          <div className="flex-1 m-4 rounded border border-border overflow-hidden" data-testid="preview-content">
            {isRunning ? (
              <div className="h-full bg-white">
                {/* Mock Application Preview */}
                <div className="bg-blue-500 text-white p-3 text-center font-bold text-sm">
                  {projectName} - Live Preview
                </div>
                <div className="p-4 space-y-4">
                  {/* Mock Social Media Interface */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 bg-white rounded p-2 text-sm text-gray-700 border">
                      What's happening?
                    </div>
                    <Button size="sm" className="bg-blue-500 text-white">
                      Post
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 border rounded">
                      <div className="w-8 h-8 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-gray-900">@john_doe</div>
                        <div className="text-gray-700 mt-1">
                          Just built an amazing {projectName} with AI assistance! 🚀
                        </div>
                        <div className="text-gray-500 text-xs mt-2">2 minutes ago</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 border rounded">
                      <div className="w-8 h-8 bg-green-400 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-gray-900">@ai_developer</div>
                        <div className="text-gray-700 mt-1">
                          Welcome to your new social platform! All features are working perfectly.
                        </div>
                        <div className="text-gray-500 text-xs mt-2">5 minutes ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/10">
                <div className="text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Preview Not Running</h3>
                  <p className="text-sm">Click "Run" to start the development server</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="console" className="flex-1 flex flex-col mt-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Console Output</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLogs([])}
                data-testid="button-clear-logs"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No console output</p>
                  <p className="text-xs">Logs will appear here when the server is running</p>
                </div>
              </div>
            ) : (
              <div className="p-4 font-mono text-xs space-y-1" data-testid="console-logs">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2">
                    <span className="text-muted-foreground text-xs">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={getLogColor(log.level)}>
                      {getLogPrefix(log.level)}
                    </span>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

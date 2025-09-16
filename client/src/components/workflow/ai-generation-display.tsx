import { useState, useEffect } from 'react';
import { FileText, Check, MessageCircle, Code } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Typewriter } from '@/components/ui/typewriter';
import type { Workflow } from '@shared/schema';

interface AIGenerationDisplayProps {
  workflow: Workflow;
  projectName: string;
}

interface GeneratedFile {
  path: string;
  description: string;
  status: 'generating' | 'complete' | 'pending';
  progress?: number;
}

interface AIMessage {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'progress' | 'complete';
}

export function AIGenerationDisplay({ workflow, projectName }: AIGenerationDisplayProps) {
  const [currentFile, setCurrentFile] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    // Simulate AI generation progress
    const files: GeneratedFile[] = [
      { path: 'server/models/User.js', description: 'MongoDB user schema with authentication', status: 'complete' },
      { path: 'server/routes/auth.js', description: 'Authentication routes with JWT', status: 'complete' },
      { path: 'client/src/components/LoginForm.jsx', description: 'React login component with validation', status: 'complete' },
      { path: 'client/src/components/PostFeed.jsx', description: 'Real-time post feed component', status: 'generating', progress: 75 },
      { path: 'client/src/components/TweetCard.jsx', description: 'Individual tweet display component', status: 'pending' },
      { path: 'server/routes/posts.js', description: 'Post management API endpoints', status: 'pending' },
    ];

    const messages: AIMessage[] = [
      {
        id: '1',
        message: `Starting code generation for ${projectName}. Setting up authentication system with JWT tokens and password hashing.`,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: 'info'
      },
      {
        id: '2',
        message: 'Completed authentication system. Generated secure login/signup flows with bcrypt password hashing.',
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
        type: 'complete'
      },
      {
        id: '3',
        message: 'Now generating PostFeed component with real-time updates using WebSocket connections...',
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        type: 'progress'
      },
    ];

    setGeneratedFiles(files);
    setAIMessages(messages);
    setCurrentFile('client/src/components/PostFeed.jsx');
    setOverallProgress(65);
  }, [projectName]);

  const completedFiles = generatedFiles.filter(f => f.status === 'complete').length;
  const totalFiles = generatedFiles.length;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Code Generation Progress</h3>
              <p className="text-sm text-muted-foreground">
                Generating {projectName} based on approved specifications
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-ai" data-testid="generation-progress">
                {overallProgress}%
              </div>
              <div className="text-xs text-muted-foreground">
                {completedFiles} of {totalFiles} files
              </div>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current File Being Generated */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-ai/10 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-ai" />
            </div>
            <div>
              <h3 className="font-medium">Currently Generating</h3>
              <p className="text-sm text-ai font-mono" data-testid="current-file">
                {currentFile}
              </p>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm">
            <div className="text-ai mb-2">// AI is writing PostFeed component...</div>
            <Typewriter
              text="import React, { useState, useEffect } from 'react';"
              speed={100}
              className="text-foreground"
              data-testid="typewriter-code"
            />
          </div>
        </CardContent>
      </Card>

      {/* Generated Files List */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4 flex items-center">
            <Code className="w-4 h-4 mr-2" />
            Generated Files
          </h3>
          
          <div className="space-y-3">
            {generatedFiles.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                data-testid={`generated-file-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    file.status === 'complete' ? 'bg-green-500/10' :
                    file.status === 'generating' ? 'bg-ai/10' : 'bg-muted'
                  }`}>
                    {file.status === 'complete' ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : file.status === 'generating' ? (
                      <FileText className="w-3 h-3 text-ai animate-pulse" />
                    ) : (
                      <FileText className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-sm">{file.path}</p>
                    <p className="text-xs text-muted-foreground">{file.description}</p>
                    {file.status === 'generating' && file.progress && (
                      <div className="mt-1 w-32">
                        <Progress value={file.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={file.status === 'complete' ? 'default' : 'secondary'}
                  className={
                    file.status === 'complete' ? 'bg-green-500/10 text-green-400' :
                    file.status === 'generating' ? 'bg-ai/10 text-ai' : 'bg-muted text-muted-foreground'
                  }
                >
                  {file.status === 'complete' ? 'Complete' :
                   file.status === 'generating' ? 'Generating' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live AI Chat */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4 flex items-center">
            <MessageCircle className="w-4 h-4 mr-2 text-ai" />
            AI Developer Updates
          </h3>
          
          <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
            {aiMessages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3" data-testid={`ai-message-${message.id}`}>
                <div className="w-8 h-8 bg-ai/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-ai" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium text-ai">AI Developer:</span> 
                    {' '}{message.message}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

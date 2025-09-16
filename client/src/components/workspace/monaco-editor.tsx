import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@shared/schema';

interface MonacoEditorProps {
  file: ProjectFile;
  onChange?: (content: string) => void;
  className?: string;
}

// Mock Monaco Editor with syntax highlighting
const SyntaxHighlighter = ({ content, language }: { content: string; language: string }) => {
  const getTokens = (text: string, lang: string) => {
    // Simple tokenization for demo purposes
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      const tokens: Array<{text: string; type: string; start: number; end: number}> = [];
      let currentIndex = 0;
      
      // Basic keyword highlighting
      const keywords = ['import', 'export', 'const', 'let', 'var', 'function', 'class', 'return', 'if', 'else', 'for', 'while'];
      const strings = line.match(/'[^']*'|"[^"]*"|`[^`]*`/g) || [];
      const comments = line.match(/\/\/.*$/g) || [];
      
      // Highlight keywords
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        let match;
        while ((match = regex.exec(line)) !== null) {
          tokens.push({
            text: keyword,
            type: 'keyword',
            start: match.index,
            end: match.index + keyword.length
          });
        }
      });
      
      // Highlight strings
      strings.forEach(str => {
        const start = line.indexOf(str);
        if (start !== -1) {
          tokens.push({
            text: str,
            type: 'string',
            start,
            end: start + str.length
          });
        }
      });
      
      // Highlight comments
      comments.forEach(comment => {
        const start = line.indexOf(comment);
        if (start !== -1) {
          tokens.push({
            text: comment,
            type: 'comment',
            start,
            end: start + comment.length
          });
        }
      });
      
      return { line, tokens: tokens.sort((a, b) => a.start - b.start) };
    });
  };

  const renderLine = (lineData: any, lineIndex: number) => {
    const { line, tokens } = lineData;
    const elements = [];
    let lastIndex = 0;
    
    tokens.forEach((token: any, tokenIndex: number) => {
      // Add text before token
      if (token.start > lastIndex) {
        elements.push(
          <span key={`text-${tokenIndex}`}>
            {line.slice(lastIndex, token.start)}
          </span>
        );
      }
      
      // Add token with highlighting
      elements.push(
        <span
          key={`token-${tokenIndex}`}
          className={cn(
            token.type === 'keyword' && 'text-purple-400',
            token.type === 'string' && 'text-green-400',
            token.type === 'comment' && 'text-gray-500'
          )}
        >
          {token.text}
        </span>
      );
      
      lastIndex = token.end;
    });
    
    // Add remaining text
    if (lastIndex < line.length) {
      elements.push(
        <span key="remaining">
          {line.slice(lastIndex)}
        </span>
      );
    }
    
    return (
      <div key={lineIndex} className="flex">
        <span className="text-muted-foreground mr-4 select-none w-8 text-right text-xs">
          {lineIndex + 1}
        </span>
        <span className="flex-1">{elements}</span>
      </div>
    );
  };

  const tokenizedLines = getTokens(content, language);

  return (
    <div className="font-mono text-sm leading-relaxed">
      {tokenizedLines.map((lineData, index) => renderLine(lineData, index))}
    </div>
  );
};

export function MonacoEditor({ file, onChange, className }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(file.content || '');
  const [isEditing, setIsEditing] = useState(false);

  // Sample content for different file types
  const getSampleContent = (path: string, language: string) => {
    if (content) return content;
    
    const fileName = path.split('/').pop() || '';
    
    switch (language) {
      case 'javascript':
        if (fileName.includes('App')) {
          return `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import PostFeed from './components/PostFeed';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<PostFeed />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;`;
        }
        return `// ${fileName}
console.log('Hello from ${fileName}');`;
        
      case 'typescript':
        return `// ${fileName}
interface ${fileName.replace('.tsx', '').replace('.ts', '')}Props {
  children?: React.ReactNode;
}

export default function ${fileName.replace('.tsx', '').replace('.ts', '')}() {
  return <div>Component content</div>;
}`;
        
      case 'css':
        return `/* ${fileName} */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}`;
        
      case 'json':
        return `{
  "name": "${fileName}",
  "version": "1.0.0",
  "description": "Generated configuration file"
}`;
        
      default:
        return `// ${fileName}
// File content will be loaded here...`;
    }
  };

  const displayContent = getSampleContent(file.path, file.language || 'plaintext');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    setContent(file.content || '');
  }, [file.id, file.content]);

  return (
    <div className={cn("h-full bg-muted/10", className)} data-testid="monaco-editor">
      <div className="h-full overflow-auto custom-scrollbar">
        {isEditing ? (
          <textarea
            ref={editorRef as any}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={handleBlur}
            className="w-full h-full p-4 bg-transparent font-mono text-sm resize-none outline-none border-none"
            style={{ minHeight: '100%' }}
            autoFocus
            data-testid="editor-textarea"
          />
        ) : (
          <div 
            className="p-4 cursor-text h-full"
            onDoubleClick={handleDoubleClick}
            data-testid="editor-display"
          >
            <div className="text-muted-foreground mb-4 text-xs border-b border-border pb-2">
              {file.path} • {file.language || 'plaintext'} • Double-click to edit
            </div>
            <SyntaxHighlighter 
              content={displayContent} 
              language={file.language || 'plaintext'} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

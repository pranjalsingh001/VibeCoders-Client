import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@shared/schema';
import { fileService } from '@/lib/services/fileService';
import { useToast } from '@/hooks/use-toast';

interface MonacoEditorProps {
  file: ProjectFile;
  projectId?: string;
  onChange?: (content: string) => void;
  className?: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  'ts': 'typescript',
  'tsx': 'typescript',
  'js': 'javascript',
  'jsx': 'javascript',
  'css': 'css',
  'scss': 'scss',
  'html': 'html',
  'json': 'json',
  'md': 'markdown',
  'py': 'python',
  'sh': 'shell',
  'yaml': 'yaml',
  'yml': 'yaml',
};

function detectLanguage(path: string, fileLanguage?: string): string {
  if (fileLanguage && fileLanguage !== 'plaintext') return fileLanguage;
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return LANGUAGE_MAP[ext] || 'plaintext';
}

export function MonacoEditor({ file, projectId, onChange, className }: MonacoEditorProps) {
  const [content, setContent] = useState(file.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setContent(file.content || '');
  }, [file.id, file.content]);

  const handleChange = (newContent: string | undefined) => {
    const value = newContent ?? '';
    setContent(value);
    onChange?.(value);

    // Auto-save with debounce
    if (projectId) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          await fileService.write(projectId, file.path, value);
        } catch (err: any) {
          toast({
            title: 'Save failed',
            description: err.message || 'Could not save the file.',
            variant: 'destructive',
          });
        } finally {
          setIsSaving(false);
        }
      }, 800);
    }
  };

  const language = detectLanguage(file.path, file.language ?? undefined);

  return (
    <div className={cn('h-full flex flex-col bg-[#1e1e1e]', className)} data-testid="monaco-editor">
      {/* Editor status bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#1e1e1e] border-b border-[#333] text-xs text-gray-400">
        <span className="font-mono">{file.path}</span>
        <div className="flex items-center gap-3">
          <span>{language}</span>
          {isSaving && <span className="text-yellow-400">Saving…</span>}
          {!isSaving && projectId && <span className="text-green-400">Saved</span>}
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Monaco, Menlo, "Ubuntu Mono", monospace',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: 'selection',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
          }}
          data-testid="editor-textarea"
        />
      </div>
    </div>
  );
}

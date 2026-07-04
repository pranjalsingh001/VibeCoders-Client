import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Globe, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LivePreviewProps {
  projectId: string;
  projectName: string;
  isRunning: boolean;
  sessionUrl?: string;
}

export function LivePreview({ projectId, projectName, isRunning, sessionUrl }: LivePreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [url, setUrl] = useState(sessionUrl || '');

  useEffect(() => {
    if (sessionUrl) {
      setUrl(sessionUrl);
    }
  }, [sessionUrl]);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleOpenExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!isRunning || !url) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/10" data-testid="preview-content">
        <div className="text-center">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-medium mb-2">Preview Not Running</h3>
          <p className="text-sm">Click "Run" in the Terminal tab to start the server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" data-testid="preview-content">
      {/* URL Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
        <div className="flex-1 bg-background rounded border border-border px-3 py-1 text-xs font-mono text-muted-foreground truncate">
          {url}
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} data-testid="button-refresh-preview" title="Refresh preview">
          <RefreshCw className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleOpenExternal} data-testid="button-open-external" title="Open in new tab">
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {/* iFrame Preview */}
      <div className="flex-1 relative">
        <iframe
          key={iframeKey}
          src={url}
          className="absolute inset-0 w-full h-full border-0"
          title={`${projectName} Live Preview`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}

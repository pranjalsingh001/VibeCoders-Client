import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  cursor?: boolean;
}

export function Typewriter({ 
  text, 
  delay = 0, 
  speed = 50, 
  className,
  onComplete,
  cursor = true 
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, delay + speed);

      return () => clearTimeout(timeout);
    } else {
      onComplete?.();
      if (cursor) {
        // Blink cursor after completion
        const interval = setInterval(() => {
          setShowCursor(prev => !prev);
        }, 750);
        return () => clearInterval(interval);
      }
    }
  }, [currentIndex, text, delay, speed, onComplete, cursor]);

  return (
    <span className={cn("font-mono", className)}>
      {displayText}
      {cursor && (currentIndex < text.length || showCursor) && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

interface TypewriterLineProps {
  lines: string[];
  delay?: number;
  speed?: number;
  lineDelay?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypewriterLines({ 
  lines, 
  delay = 0, 
  speed = 50, 
  lineDelay = 1000,
  className,
  onComplete 
}: TypewriterLineProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [completedLines, setCompletedLines] = useState<string[]>([]);

  const handleLineComplete = () => {
    setCompletedLines(prev => [...prev, lines[currentLine]]);
    
    if (currentLine < lines.length - 1) {
      setTimeout(() => {
        setCurrentLine(currentLine + 1);
      }, lineDelay);
    } else {
      onComplete?.();
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {completedLines.map((line, index) => (
        <div key={index} className="font-mono">{line}</div>
      ))}
      {currentLine < lines.length && (
        <Typewriter
          text={lines[currentLine]}
          delay={delay}
          speed={speed}
          onComplete={handleLineComplete}
        />
      )}
    </div>
  );
}

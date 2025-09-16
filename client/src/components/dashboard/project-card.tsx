import { useLocation } from 'wouter';
import { Calendar, Layers, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectCardProps {
  project: any;
}

const getStatusColor = (stage: string) => {
  switch (stage) {
    case 'planning':
      return 'bg-yellow-500/10 text-yellow-400';
    case 'blueprint':
      return 'bg-blue-500/10 text-blue-400';
    case 'hld':
    case 'lld':
      return 'bg-purple-500/10 text-purple-400';
    case 'codegen':
      return 'bg-ai/10 text-ai';
    case 'completed':
      return 'bg-green-500/10 text-green-400';
    case 'failed':
      return 'bg-red-500/10 text-red-400';
    default:
      return 'bg-gray-500/10 text-gray-400';
  }
};

const getStageLabel = (stage: string) => {
  switch (stage) {
    case 'planning':
      return 'Planning';
    case 'blueprint':
      return 'Blueprint';
    case 'hld':
      return 'High-Level Design';
    case 'lld':
      return 'Low-Level Design';
    case 'codegen':
      return 'Coding';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
};

const getProgressPercentage = (stage: string, status: string) => {
  const stageProgress = {
    planning: 10,
    blueprint: 25,
    hld: 50,
    lld: 65,
    codegen: 85,
    completed: 100,
    failed: 0,
  };
  
  let baseProgress = stageProgress[stage as keyof typeof stageProgress] || 0;
  
  // If status is 'in-progress', add some progress within the stage
  if (status === 'in-progress' && stage !== 'completed') {
    baseProgress += 10;
  }
  
  return Math.min(baseProgress, 100);
};

export function ProjectCard({ project }: ProjectCardProps) {
  const [, setLocation] = useLocation();
  const { workflow } = project;
  
  const stage = workflow?.stage || 'planning';
  const status = workflow?.status || 'idle';
  const progress = getProgressPercentage(stage, status);
  
  const handleCardClick = () => {
    setLocation(`/workflow/${project.id}`);
  };

  const formatDate = (date: string | Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
      data-testid={`project-card-${project.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 ai-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold" data-testid={`project-name-${project.id}`}>
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {project.techStack || 'Tech stack pending'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(stage)} data-testid={`project-status-${project.id}`}>
              {getStageLabel(stage)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" data-testid={`project-menu-${project.id}`}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/workspace/${project.id}`); }}>
                  Open Workspace
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4" data-testid={`project-description-${project.id}`}>
          {project.description}
        </p>
        
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(project.updatedAt || project.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Layers className="w-4 h-4" />
            <span>{project.techStack || 'Pending'}</span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="text-xs font-medium" data-testid={`project-progress-${project.id}`}>
              {progress}%
            </div>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div 
              className="bg-ai h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

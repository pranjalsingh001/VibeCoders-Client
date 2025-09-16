import { useQuery } from '@tanstack/react-query';
import { Plus, Folder, PlayCircle, CheckCircle, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { ProjectCard } from '@/components/dashboard/project-card';
import { CreateProjectModal } from '@/components/dashboard/create-project-modal';
import { useState } from 'react';

export default function DashboardPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => api.projects.list(),
  });

  // Calculate stats
  const stats = {
    totalProjects: projects.length,
    inProgress: projects.filter((p: any) => p.workflow?.stage !== 'completed' && p.workflow?.stage !== 'failed').length,
    completed: projects.filter((p: any) => p.workflow?.stage === 'completed').length,
    aiSessions: projects.reduce((acc: number, p: any) => acc + (p.workflow ? 1 : 0), 0),
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
            <p className="text-muted-foreground">Manage your AI-powered development projects</p>
          </div>
          
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 font-medium flex items-center space-x-2"
                data-testid="button-create-project"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Project</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <CreateProjectModal onClose={() => setCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-projects">{stats.totalProjects}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Folder className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-ai" data-testid="stat-in-progress">{stats.inProgress}</p>
                </div>
                <div className="p-3 bg-ai/10 rounded-lg">
                  <PlayCircle className="w-6 h-6 text-ai" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-400" data-testid="stat-completed">{stats.completed}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Sessions</p>
                  <p className="text-2xl font-bold text-orange-400" data-testid="stat-ai-sessions">{stats.aiSessions}</p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Cpu className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Cards Grid */}
        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 ai-gradient rounded-xl flex items-center justify-center">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first AI-powered project to get started
                </p>
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="ai-gradient text-white"
                  data-testid="button-create-first-project"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="projects-grid">
            {projects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

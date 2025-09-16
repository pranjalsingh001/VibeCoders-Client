import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Pause, Code, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { WorkflowStepper } from '@/components/workflow/workflow-stepper';
import { QuestionList } from '@/components/workflow/question-list';
import { AIGenerationDisplay } from '@/components/workflow/ai-generation-display';
import { parseAIResponse, PlanningResponseSchema, type PlanningQuestion } from '@/lib/json-parser';

export default function WorkflowPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { setCurrentWorkflow, currentWorkflow } = useWorkflowStore();
  const [planningQuestions, setPlanningQuestions] = useState<PlanningQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const projectId = params.projectId as string;

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: () => api.projects.get(projectId),
    enabled: !!projectId,
  });

  const { data: workflow, isLoading: workflowLoading } = useQuery({
    queryKey: ['/api/workflow', projectId, 'status'],
    queryFn: () => api.workflow.getStatus(projectId),
    enabled: !!projectId,
    refetchInterval: (data) => {
      // Refetch more frequently if workflow is in progress
      if (data && 'status' in data && data.status === 'in-progress') return 2000;
      return 5000;
    },
  });

  useEffect(() => {
    if (workflow) {
      setCurrentWorkflow(workflow);
    }
  }, [workflow, setCurrentWorkflow]);

  useEffect(() => {
    // Generate initial planning questions if we're in planning stage
    if (workflow?.stage === 'planning' && planningQuestions.length === 0 && project) {
      generatePlanningQuestions();
    }
  }, [workflow, project, planningQuestions.length]);

  const generatePlanningQuestions = () => {
    // Mock AI-generated questions based on project description
    const mockQuestions: PlanningQuestion[] = [
      {
        id: 'target-audience',
        question: 'Who is the target audience for this application?',
        type: 'text',
        required: true,
      },
      {
        id: 'key-features',
        question: 'What are the core features you want to implement first?',
        type: 'text',
        required: true,
      },
      {
        id: 'user-auth',
        question: 'Do you need user authentication?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'deployment',
        question: 'Where do you plan to deploy this application?',
        type: 'choice',
        options: ['Vercel', 'Netlify', 'AWS', 'Heroku', 'Other'],
        required: false,
      },
      {
        id: 'database',
        question: 'What type of data will you be storing?',
        type: 'text',
        required: true,
      },
    ];

    setPlanningQuestions(mockQuestions);
  };

  const planningMutation = useMutation({
    mutationFn: (answers: Record<string, any>) => 
      api.planning({ projectId, answers: Object.entries(answers).map(([id, value]) => ({ id, value })) }),
    onSuccess: () => {
      // Refetch workflow status
      // The query will automatically refetch due to the mutation
    },
  });

  const handlePlanningSubmit = () => {
    if (planningQuestions.every(q => !q.required || answers[q.id] !== undefined)) {
      planningMutation.mutate(answers);
    }
  };

  const isLoading = projectLoading || workflowLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-80 bg-card border-r border-border animate-pulse">
          <div className="p-6 space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 animate-pulse">
          <div className="h-16 bg-muted border-b"></div>
          <div className="p-6 space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project || !workflow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation('/')}>
              Go back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        {/* Project Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold" data-testid="project-name">
              {project.name}
            </h1>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-ai rounded-full animate-pulse-soft"></div>
              <span className="text-xs text-ai font-medium">AI Active</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="project-description">
            {project.description}
          </p>
        </div>

        {/* Workflow Steps */}
        <WorkflowStepper workflow={workflow} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" data-testid="workflow-stage-title">
                {workflow.stage === 'planning' && 'Project Planning'}
                {workflow.stage === 'blueprint' && 'Blueprint Generation'}
                {workflow.stage === 'hld' && 'High-Level Design'}
                {workflow.stage === 'lld' && 'Low-Level Design'}
                {workflow.stage === 'codegen' && 'Code Generation in Progress'}
                {workflow.stage === 'completed' && 'Project Completed'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {workflow.stage === 'planning' && 'Answer questions to help AI understand your requirements'}
                {workflow.stage === 'blueprint' && 'AI is generating your project blueprint'}
                {workflow.stage === 'hld' && 'AI is creating system architecture'}
                {workflow.stage === 'lld' && 'AI is designing detailed specifications'}
                {workflow.stage === 'codegen' && `AI is building your ${project.name} based on the approved design`}
                {workflow.stage === 'completed' && 'Your project has been successfully generated'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {workflow.stage === 'codegen' && (
                <Button variant="secondary" size="sm">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button 
                onClick={() => setLocation(`/workspace/${projectId}`)}
                data-testid="button-open-workspace"
              >
                <Code className="w-4 h-4 mr-2" />
                Open Workspace
              </Button>
            </div>
          </div>
        </div>

        {/* Dynamic Content based on stage */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {workflow.stage === 'planning' && (
            <QuestionList
              questions={planningQuestions}
              answers={answers}
              onAnswerChange={setAnswers}
              onSubmit={handlePlanningSubmit}
              isSubmitting={planningMutation.isPending}
            />
          )}

          {(workflow.stage === 'blueprint' || workflow.stage === 'hld' || workflow.stage === 'lld') && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-ai/10 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-ai" />
                    </div>
                    <div>
                      <h3 className="font-medium">AI is working...</h3>
                      <p className="text-sm text-ai font-mono">
                        Generating {workflow.stage === 'blueprint' ? 'project blueprint' : workflow.stage.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-ai rounded-full animate-pulse"></div>
                      <span className="text-sm text-ai">Processing requirements...</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-ai h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {workflow.stage === 'codegen' && (
            <AIGenerationDisplay workflow={workflow} projectName={project.name} />
          )}

          {workflow.stage === 'completed' && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Code className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-green-400">
                  Project Completed!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Your {project.name} has been successfully generated and is ready for development.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={() => setLocation(`/workspace/${projectId}`)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Open in Workspace
                  </Button>
                  <Button variant="outline">
                    Download Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

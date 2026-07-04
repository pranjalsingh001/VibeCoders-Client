import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Code, ChevronRight, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { WorkflowStepper } from '@/components/workflow/workflow-stepper';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Question { id: string; question: string; }
interface WorkflowStatus {
  stage: string;
  status: string;
  results: {
    planning?: { questions: any; answers: any };
    blueprint?: any;
    hld?: any;
    lld?: any;
  };
}

// ─── Stage Config ─────────────────────────────────────────────────────────────
const STAGE_ORDER = ['planning', 'blueprint', 'hld', 'lld', 'codegen', 'completed'];

const STAGE_LABELS: Record<string, string> = {
  planning: '📋 Project Planning',
  blueprint: '🗺️ Blueprint Generation',
  hld: '🏗️ High-Level Design',
  lld: '🔩 Low-Level Design',
  codegen: '💻 Code Generation',
  completed: '✅ Project Completed',
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  planning: 'AI asks clarifying questions to understand your project deeply',
  blueprint: 'AI generates tech stack, features, folder structure and architecture plan',
  hld: 'AI designs system architecture, services and data flow diagrams',
  lld: 'AI creates detailed component specs, DB schemas and API contracts',
  codegen: 'AI writes all your project files based on the approved design',
  completed: 'Your project has been fully generated and is ready for development!',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function WorkflowPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;

  // Planning Q&A state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  // ─── Project Data ───────────────────────────────────────────────────────────
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: () => api.projects.get(projectId),
    enabled: !!projectId && projectId !== 'undefined',
  });
  const project = projectData?.project || projectData;

  // ─── Workflow Status ────────────────────────────────────────────────────────
  const { data: workflowData, isLoading: workflowLoading } = useQuery({
    queryKey: ['/api/workflow', projectId, 'status'],
    queryFn: () => api.workflow.getStatus(projectId),
    enabled: !!projectId && projectId !== 'undefined',
    refetchInterval: (query) => {
      const data = query.state.data as any;
      const wf = data?.workflow || data;
      if (wf?.status === 'in-progress') return 3000;
      return 8000;
    },
  });
  const workflow: WorkflowStatus = workflowData?.workflow || workflowData;

  // ─── Fetch Questions when on planning stage ─────────────────────────────────
  const { mutate: fetchQuestions, isPending: fetchingQuestions } = useMutation({
    mutationFn: () => api.planning.clarify({ projectId }),
    onSuccess: (data: any) => {
      const qs: Question[] = Array.isArray(data.questions)
        ? data.questions
        : typeof data.questions === 'string'
        ? data.questions.split('\n').filter(Boolean).map((q: string, i: number) => ({ id: String(i), question: q }))
        : [];
      setQuestions(qs);
      setQuestionsLoaded(true);
    },
    onError: () => {
      toast({ title: 'Failed to load questions', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (workflow?.stage === 'planning' && !questionsLoaded && project) {
      // Check if we already have questions from workflow results
      if (workflow.results?.planning?.questions) {
        const qs = workflow.results.planning.questions;
        const parsed: Question[] = Array.isArray(qs)
          ? qs
          : typeof qs === 'string'
          ? qs.split('\n').filter(Boolean).map((q: string, i: number) => ({ id: String(i), question: q }))
          : [];
        setQuestions(parsed);
        setQuestionsLoaded(true);
      } else {
        fetchQuestions();
      }
    }
  }, [workflow?.stage, project, questionsLoaded]);

  // ─── Submit Planning Answers ────────────────────────────────────────────────
  const { mutate: submitAnswers, isPending: submittingAnswers } = useMutation({
    mutationFn: () =>
      api.planning.submitAnswers({
        projectId,
        answers: Object.entries(answers).map(([id, value]) => ({ id, value })),
      }),
    onSuccess: () => {
      toast({ title: 'Answers submitted! AI is running next stage...' });
      runNextStage();
    },
    onError: (err: any) => {
      toast({ title: 'Failed to submit answers', description: err.message, variant: 'destructive' });
    },
  });

  // ─── Run Next Workflow Stage ────────────────────────────────────────────────
  const { mutate: runNextStage, isPending: running } = useMutation({
    mutationFn: () => api.workflow.next(projectId, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow', projectId, 'status'] });
      toast({ title: '⚡ AI is working on the next stage...', description: 'This may take a moment.' });
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow', projectId, 'status'] });
      toast({ title: 'Stage failed', description: err.message, variant: 'destructive' });
    },
  });

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (projectLoading || workflowLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project || !workflow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-4">
              The project doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRunning = workflow.status === 'in-progress' || running || submittingAnswers;
  const canProceed = workflow.status !== 'in-progress' && workflow.stage !== 'completed';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-72 bg-card border-r border-border flex flex-col shrink-0">
        {/* Project Header */}
        <div className="p-4 border-b border-border">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-base font-semibold leading-tight">{project.name}</h1>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.idea || project.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-yellow-400 animate-pulse' : workflow.stage === 'completed' ? 'bg-green-400' : 'bg-primary'}`} />
            <span className="text-xs text-muted-foreground">
              {isRunning ? 'AI Working...' : workflow.stage === 'completed' ? 'Completed' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto p-4">
          <WorkflowStepper workflow={workflow} />
        </div>

        {/* Open Workspace button */}
        <div className="p-4 border-t border-border">
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setLocation(`/workspace/${projectId}`)}
          >
            <Code className="w-4 h-4 mr-2" /> Open Workspace
          </Button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{STAGE_LABELS[workflow.stage] || workflow.stage}</h2>
              <p className="text-sm text-muted-foreground">{STAGE_DESCRIPTIONS[workflow.stage]}</p>
            </div>
            <div className="flex items-center gap-3">
              {isRunning && (
                <Badge variant="secondary" className="animate-pulse">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> AI Working
                </Badge>
              )}
              {workflow.status === 'failed' && (
                <Button size="sm" variant="destructive" onClick={() => runNextStage()}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stage Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── PLANNING STAGE ── */}
          {workflow.stage === 'planning' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Idea</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {project.idea || project.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>

              {fetchingQuestions ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground">AI is generating clarifying questions...</p>
                  </CardContent>
                </Card>
              ) : questions.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📝 Clarifying Questions</CardTitle>
                    <p className="text-sm text-muted-foreground">Answer these questions to help the AI plan your project better.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {questions.map((q, i) => (
                      <div key={q.id || i} className="space-y-1">
                        <label className="text-sm font-medium">
                          {i + 1}. {q.question}
                        </label>
                        <Textarea
                          rows={2}
                          placeholder="Your answer..."
                          value={answers[q.id || String(i)] || ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [q.id || String(i)]: e.target.value }))
                          }
                          className="resize-none text-sm"
                        />
                      </div>
                    ))}
                    <Button
                      className="w-full mt-2"
                      onClick={() => submitAnswers()}
                      disabled={submittingAnswers || running || Object.keys(answers).length === 0}
                    >
                      {submittingAnswers || running ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                      ) : (
                        <><ChevronRight className="w-4 h-4 mr-2" /> Submit Answers & Generate Blueprint</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center space-y-4">
                    <p className="text-muted-foreground text-sm">Ready to begin! Click below to let AI start the planning process.</p>
                    <Button onClick={() => runNextStage()} disabled={isRunning}>
                      {isRunning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</> : <><ChevronRight className="w-4 h-4 mr-2" /> Start AI Planning</>}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── BLUEPRINT / HLD / LLD: AI IS WORKING OR SHOWING RESULTS ── */}
          {(workflow.stage === 'blueprint' || workflow.stage === 'hld' || workflow.stage === 'lld') && (
            <div className="max-w-4xl mx-auto space-y-6">
              {isRunning ? (
                <Card>
                  <CardContent className="p-10 text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <h3 className="font-semibold text-lg">AI is generating {STAGE_LABELS[workflow.stage]}...</h3>
                    <p className="text-muted-foreground text-sm">This may take 30–60 seconds. Please wait.</p>
                    <div className="w-full bg-muted rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                      <div className="bg-primary h-2 rounded-full animate-pulse w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Show results if available */}
                  {workflow.results?.blueprint && (
                    <ResultCard title="🗺️ Blueprint" data={workflow.results.blueprint} />
                  )}
                  {workflow.results?.hld && (workflow.stage === 'lld' || workflow.stage === 'hld') && (
                    <ResultCard title="🏗️ High-Level Design" data={workflow.results.hld} />
                  )}
                  {workflow.results?.lld && workflow.stage === 'lld' && (
                    <ResultCard title="🔩 Low-Level Design" data={workflow.results.lld} />
                  )}

                  {/* Approve & Proceed button */}
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Review complete?</h3>
                        <p className="text-sm text-muted-foreground">Approve the {STAGE_LABELS[workflow.stage]} and let AI proceed to the next stage.</p>
                      </div>
                      <Button onClick={() => runNextStage()} disabled={isRunning} className="shrink-0 ml-4">
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Approve & Proceed
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* If no results yet and not running, show start button */}
              {!isRunning && !workflow.results?.blueprint && workflow.stage === 'blueprint' && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4 text-sm">Planning stage complete. Click below to generate the blueprint.</p>
                    <Button onClick={() => runNextStage()} disabled={isRunning}>
                      <ChevronRight className="w-4 h-4 mr-2" /> Generate Blueprint
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── CODEGEN STAGE ── */}
          {workflow.stage === 'codegen' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {isRunning ? (
                <Card>
                  <CardContent className="p-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl">AI is writing your code...</h3>
                    <p className="text-muted-foreground">Building all project files based on the approved design. This may take a few minutes.</p>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-2 rounded-full animate-pulse w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center space-y-4">
                    <p className="text-muted-foreground text-sm">Design approved! Click below to start code generation.</p>
                    <Button onClick={() => runNextStage()} disabled={isRunning} size="lg">
                      <Code className="w-4 h-4 mr-2" /> Start Code Generation
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── COMPLETED STAGE ── */}
          {workflow.stage === 'completed' && (
            <div className="max-w-2xl mx-auto">
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-10 text-center space-y-4">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-400">Project Completed!</h3>
                  <p className="text-muted-foreground">
                    Your <strong>{project.name}</strong> has been fully designed and generated. Open the workspace to view your code.
                  </p>
                  <div className="flex justify-center gap-4 pt-2">
                    <Button onClick={() => setLocation(`/workspace/${projectId}`)} className="bg-green-500 hover:bg-green-600">
                      <Code className="w-4 h-4 mr-2" /> Open Workspace
                    </Button>
                    <Button variant="outline" onClick={() => setLocation('/dashboard')}>
                      Back to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Reference Documents for later stages */}
          {(workflow.stage === 'codegen' || workflow.stage === 'completed') && (workflow.results?.blueprint || workflow.results?.hld || workflow.results?.lld) && (
            <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-border space-y-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Project Reference Design</h3>
              {workflow.results?.blueprint && (
                <ResultCard title="🗺️ Blueprint" data={workflow.results.blueprint} />
              )}
              {workflow.results?.hld && (
                <ResultCard title="🏗️ High-Level Design" data={workflow.results.hld} />
              )}
              {workflow.results?.lld && (
                <ResultCard title="🔩 Low-Level Design" data={workflow.results.lld} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Result Display Component ─────────────────────────────────────────────────
function ResultCard({ title, data }: { title: string; data: any }) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-auto max-h-96 whitespace-pre-wrap font-mono leading-relaxed">
          {text}
        </pre>
      </CardContent>
    </Card>
  );
}

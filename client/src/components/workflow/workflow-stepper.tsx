import { Check, Circle, Code, FileText, Layers, MessageSquare, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStepperProps {
  workflow: {
    stage: string;
    status: string;
    results?: Record<string, any>;
    [key: string]: any;
  };
}

const steps = [
  { id: 'planning', label: 'Planning', icon: MessageSquare, description: 'Requirements gathering' },
  { id: 'blueprint', label: 'Blueprint', icon: FileText, description: 'Tech stack and architecture' },
  { id: 'hld', label: 'High-Level Design', icon: Layers, description: 'System architecture' },
  { id: 'lld', label: 'Low-Level Design', icon: Layers, description: 'Detailed specifications' },
  { id: 'codegen', label: 'Code Generation', icon: Code, description: 'AI generating code' },
  { id: 'completed', label: 'Deployment', icon: Globe, description: 'Ready to deploy' },
];

export function WorkflowStepper({ workflow }: WorkflowStepperProps) {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === workflow.stage);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentStepIndex = getCurrentStepIndex();
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) {
      return workflow.status === 'in-progress' ? 'in-progress' : 'current';
    }
    return 'pending';
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-start space-x-3" data-testid={`step-${step.id}`}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                status === 'completed' && "bg-green-500",
                status === 'current' && "bg-ai",
                status === 'in-progress' && "bg-ai animate-pulse",
                status === 'pending' && "bg-muted"
              )}>
                {status === 'completed' ? (
                  <Check className="w-4 h-4 text-white" />
                ) : status === 'in-progress' ? (
                  <Icon className="w-4 h-4 text-white animate-pulse" />
                ) : (
                  <Icon className={cn(
                    "w-4 h-4",
                    status === 'current' ? "text-white" : "text-muted-foreground"
                  )} />
                )}
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  "font-medium",
                  status === 'completed' && "text-green-400",
                  status === 'current' && "text-ai",
                  status === 'in-progress' && "text-ai",
                  status === 'pending' && "text-muted-foreground"
                )} data-testid={`step-title-${step.id}`}>
                  {step.label}
                  {status === 'completed' && ' Complete'}
                  {status === 'in-progress' && ' In Progress'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
                {status === 'in-progress' && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ai">Processing...</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-ai h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: '65%' }}
                      ></div>
                    </div>
                  </div>
                )}
                {(status === 'completed' || status === 'current') && step.id !== 'completed' && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {step.id === 'planning' && Boolean(workflow.planningAnswers) && `${Object.keys(workflow.planningAnswers as Record<string, any>).length} questions answered`}
                    {step.id === 'blueprint' && Boolean(workflow.blueprint) && 'Tech stack defined'}
                    {step.id === 'hld' && Boolean(workflow.hld) && 'Architecture designed'}
                    {step.id === 'lld' && Boolean(workflow.lld) && 'Specifications completed'}
                    {step.id === 'codegen' && Boolean(workflow.codegenPlan) && `${(workflow.files as any[])?.length || 0} files generated`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

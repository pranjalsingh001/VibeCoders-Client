import { create } from 'zustand';
import type { Workflow } from '@shared/schema';

interface WorkflowState {
  workflows: Map<string, Workflow>;
  currentWorkflow: Workflow | null;
  
  setWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (projectId: string, updates: Partial<Workflow>) => void;
  getCurrentWorkflow: (projectId: string) => Workflow | undefined;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: new Map(),
  currentWorkflow: null,
  
  setWorkflow: (workflow: Workflow) => {
    const workflows = new Map(get().workflows);
    workflows.set(workflow.projectId, workflow);
    set({ workflows });
  },
  
  updateWorkflow: (projectId: string, updates: Partial<Workflow>) => {
    const workflows = new Map(get().workflows);
    const existing = workflows.get(projectId);
    if (existing) {
      workflows.set(projectId, { ...existing, ...updates });
      set({ workflows });
      
      // Update current workflow if it matches
      const { currentWorkflow } = get();
      if (currentWorkflow?.projectId === projectId) {
        set({ currentWorkflow: { ...currentWorkflow, ...updates } });
      }
    }
  },
  
  getCurrentWorkflow: (projectId: string) => {
    return get().workflows.get(projectId);
  },
  
  setCurrentWorkflow: (workflow: Workflow | null) => {
    set({ currentWorkflow: workflow });
  },
}));

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().min(10, 'Please provide a detailed description (at least 10 characters)').max(1000, 'Description too long'),
});

type CreateProjectData = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateProjectData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: api.projects.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: 'Project created!',
        description: 'Your new project has been created successfully.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create project',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateProjectData) => {
    createProjectMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          placeholder="My Awesome App"
          className="mt-2"
          data-testid="input-project-name"
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1" data-testid="error-project-name">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      
      <div>
        <Label htmlFor="description">Project Idea</Label>
        <Textarea 
          id="description"
          rows={4}
          placeholder="Describe your project idea in detail. What should it do? Who is it for?"
          className="mt-2 resize-none"
          data-testid="input-project-description"
          {...form.register('description')}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive mt-1" data-testid="error-project-description">
            {form.formState.errors.description.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          The more details you provide, the better AI can help you plan and build your project.
        </p>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4">
        <Button 
          type="button"
          variant="ghost"
          onClick={onClose}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="bg-primary hover:bg-primary/90"
          disabled={createProjectMutation.isPending}
          data-testid="button-create"
        >
          {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}

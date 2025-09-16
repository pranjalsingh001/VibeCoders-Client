import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlanningQuestion } from '@/lib/json-parser';

interface QuestionListProps {
  questions: PlanningQuestion[];
  answers: Record<string, any>;
  onAnswerChange: (answers: Record<string, any>) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function QuestionList({ 
  questions, 
  answers, 
  onAnswerChange, 
  onSubmit, 
  isSubmitting = false 
}: QuestionListProps) {
  const handleAnswerChange = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    onAnswerChange(newAnswers);
  };

  const isFormValid = () => {
    return questions.every(question => {
      if (!question.required) return true;
      const answer = answers[question.id];
      return answer !== undefined && answer !== '' && answer !== null;
    });
  };

  const renderQuestion = (question: PlanningQuestion) => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'text':
        return question.question.toLowerCase().includes('feature') || 
               question.question.toLowerCase().includes('data') ||
               question.question.length > 100 ? (
          <Textarea
            placeholder="Please provide detailed information..."
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={3}
            data-testid={`question-${question.id}`}
          />
        ) : (
          <Input
            placeholder="Type your answer here..."
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            data-testid={`question-${question.id}`}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-6" data-testid={`question-${question.id}`}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-yes`}
                checked={answer === true}
                onCheckedChange={(checked) => 
                  handleAnswerChange(question.id, checked ? true : undefined)
                }
              />
              <Label htmlFor={`${question.id}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-no`}
                checked={answer === false}
                onCheckedChange={(checked) => 
                  handleAnswerChange(question.id, checked ? false : undefined)
                }
              />
              <Label htmlFor={`${question.id}-no`}>No</Label>
            </div>
          </div>
        );

      case 'choice':
        return (
          <RadioGroup 
            value={answer || ''} 
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            data-testid={`question-${question.id}`}
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Project Planning</h2>
        <p className="text-muted-foreground">
          Help AI understand your requirements by answering these questions
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-start justify-between">
                <span data-testid={`question-title-${question.id}`}>
                  {index + 1}. {question.question}
                </span>
                {question.required && (
                  <span className="text-destructive text-sm ml-2">*</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderQuestion(question)}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {questions.filter(q => q.required && answers[q.id] !== undefined && answers[q.id] !== '').length} 
            {' of '} 
            {questions.filter(q => q.required).length} required questions answered
          </div>
          <Button
            onClick={onSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="bg-ai hover:bg-ai/90"
            data-testid="button-submit-planning"
          >
            {isSubmitting ? 'Processing...' : 'Generate Blueprint'}
          </Button>
        </div>
      </div>
    </div>
  );
}

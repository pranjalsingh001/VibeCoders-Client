import { z } from 'zod';
import JSON5 from 'json5';

export class JSONParseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'JSONParseError';
  }
}

// Robust JSON parser that handles malformed JSON from AI responses
export function parseAIResponse<T>(jsonString: string, schema?: z.ZodSchema<T>): T {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new JSONParseError('Invalid input: expected a string');
  }

  // Clean the input
  let cleaned = jsonString.trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```(?:json|javascript)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  
  // Remove leading/trailing whitespace again
  cleaned = cleaned.trim();
  
  // Try different parsing strategies
  const strategies = [
    // Strategy 1: Standard JSON.parse
    () => JSON.parse(cleaned),
    
    // Strategy 2: JSON5 parser (handles more flexible syntax)
    () => JSON5.parse(cleaned),
    
    // Strategy 3: Fix common AI response issues
    () => {
      let fixed = cleaned;
      
      // Fix trailing commas
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix unquoted keys
      fixed = fixed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      
      // Fix single quotes
      fixed = fixed.replace(/'/g, '"');
      
      // Fix escaped quotes in strings
      fixed = fixed.replace(/\\"/g, '\\"');
      
      return JSON.parse(fixed);
    },
    
    // Strategy 4: Extract JSON from text (if wrapped in explanation)
    () => {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    },
    
    // Strategy 5: Try to fix incomplete JSON
    () => {
      let fixed = cleaned;
      
      // Count braces and brackets
      const openBraces = (fixed.match(/\{/g) || []).length;
      const closeBraces = (fixed.match(/\}/g) || []).length;
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;
      
      // Add missing closing braces
      if (openBraces > closeBraces) {
        fixed += '}'.repeat(openBraces - closeBraces);
      }
      
      // Add missing closing brackets
      if (openBrackets > closeBrackets) {
        fixed += ']'.repeat(openBrackets - closeBrackets);
      }
      
      // Remove trailing comma before closing
      fixed = fixed.replace(/,(\s*[}\]])/, '$1');
      
      return JSON.parse(fixed);
    }
  ];
  
  let lastError: Error | undefined;
  
  for (const strategy of strategies) {
    try {
      const result = strategy();
      
      // Validate with schema if provided
      if (schema) {
        return schema.parse(result);
      }
      
      return result as T;
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }
  
  throw new JSONParseError(
    `Failed to parse JSON after trying all strategies. Last error: ${lastError?.message}`,
    lastError
  );
}

// Schema definitions for AI responses
export const PlanningQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(['text', 'choice', 'boolean']),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
});

export const PlanningResponseSchema = z.object({
  questions: z.array(PlanningQuestionSchema),
  estimated_duration: z.string().optional(),
  complexity: z.enum(['low', 'medium', 'high']).optional(),
});

export const BlueprintSchema = z.object({
  techStack: z.object({
    frontend: z.array(z.string()),
    backend: z.array(z.string()),
    database: z.array(z.string()),
    deployment: z.array(z.string()).optional(),
  }),
  architecture: z.string(),
  folderStructure: z.record(z.any()),
  dependencies: z.record(z.string()).optional(),
  environment: z.record(z.string()).optional(),
});

export const HLDSchema = z.object({
  systemOverview: z.string(),
  components: z.array(z.object({
    name: z.string(),
    description: z.string(),
    responsibilities: z.array(z.string()),
    dependencies: z.array(z.string()).optional(),
  })),
  dataFlow: z.string(),
  diagrams: z.array(z.object({
    type: z.string(),
    title: z.string(),
    mermaid: z.string(),
  })).optional(),
});

export const LLDSchema = z.object({
  databaseSchema: z.record(z.any()),
  apiEndpoints: z.array(z.object({
    method: z.string(),
    path: z.string(),
    description: z.string(),
    parameters: z.record(z.any()).optional(),
    response: z.record(z.any()).optional(),
  })),
  componentDetails: z.array(z.object({
    name: z.string(),
    type: z.string(),
    props: z.record(z.any()).optional(),
    state: z.record(z.any()).optional(),
  })),
});

export const CodegenSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    language: z.string(),
    description: z.string().optional(),
  })),
  buildSteps: z.array(z.string()).optional(),
  runInstructions: z.array(z.string()).optional(),
});

export type PlanningQuestion = z.infer<typeof PlanningQuestionSchema>;
export type PlanningResponse = z.infer<typeof PlanningResponseSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;
export type HLD = z.infer<typeof HLDSchema>;
export type LLD = z.infer<typeof LLDSchema>;
export type CodegenPlan = z.infer<typeof CodegenSchema>;

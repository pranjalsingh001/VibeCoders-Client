import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, signupSchema, insertProjectSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.status(201).json({
        user: { id: user.id, username: user.username, email: user.email },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        user: { id: user.id, username: user.username, email: user.email },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project routes
  app.get("/api/projects", authenticateToken, async (req: any, res) => {
    try {
      const projects = await storage.getProjectsByUserId(req.user.id);
      
      // Get workflow for each project to include status
      const projectsWithWorkflow = await Promise.all(
        projects.map(async (project) => {
          const workflow = await storage.getWorkflowByProjectId(project.id);
          return {
            ...project,
            workflow: workflow || null,
          };
        })
      );

      res.json(projectsWithWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const project = await storage.createProject(validatedData);
      
      // Create initial workflow
      const workflow = await storage.createWorkflow({
        projectId: project.id,
        stage: "planning",
        status: "idle",
      });

      res.status(201).json({ ...project, workflow });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", authenticateToken, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workflow = await storage.getWorkflowByProjectId(project.id);
      res.json({ ...project, workflow });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Workflow routes
  app.get("/api/workflow/:projectId/status", authenticateToken, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workflow = await storage.getWorkflowByProjectId(req.params.projectId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/workflow/:projectId/next", authenticateToken, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workflow = await storage.getWorkflowByProjectId(req.params.projectId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      // Update workflow with request data
      const updatedWorkflow = await storage.updateWorkflow(workflow.id, req.body);
      
      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Planning routes
  app.post("/api/planning", authenticateToken, async (req: any, res) => {
    try {
      const { projectId, answers } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workflow = await storage.getWorkflowByProjectId(projectId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      // Update workflow with planning answers
      const updatedWorkflow = await storage.updateWorkflow(workflow.id, {
        planningAnswers: answers,
        stage: "blueprint",
        status: "completed",
      });

      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Blueprint routes
  app.post("/api/blueprint", authenticateToken, async (req: any, res) => {
    try {
      const { projectId, blueprint } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workflow = await storage.getWorkflowByProjectId(projectId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      const updatedWorkflow = await storage.updateWorkflow(workflow.id, {
        blueprint,
        stage: "hld",
        status: "completed",
      });

      // Update project tech stack
      if (blueprint.techStack) {
        await storage.updateProject(projectId, { techStack: blueprint.techStack });
      }

      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Design routes
  app.post("/api/design/hld", authenticateToken, async (req: any, res) => {
    try {
      const { projectId, hld } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workflow = await storage.getWorkflowByProjectId(projectId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      const updatedWorkflow = await storage.updateWorkflow(workflow.id, {
        hld,
        stage: "lld",
        status: "completed",
      });

      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/design/lld", authenticateToken, async (req: any, res) => {
    try {
      const { projectId, lld } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workflow = await storage.getWorkflowByProjectId(projectId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      const updatedWorkflow = await storage.updateWorkflow(workflow.id, {
        lld,
        stage: "codegen",
        status: "completed",
      });

      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Code generation routes
  app.post("/api/codegen", authenticateToken, async (req: any, res) => {
    try {
      const { projectId, codegenPlan } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workflow = await storage.getWorkflowByProjectId(projectId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      const updatedWorkflow = await storage.updateWorkflow(workflow.id, {
        codegenPlan,
        stage: "completed",
        status: "completed",
      });

      // Update project status
      await storage.updateProject(projectId, { status: "completed" });

      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File management routes
  app.get("/api/files/:projectId", authenticateToken, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const files = await storage.getProjectFiles(req.params.projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/files", authenticateToken, async (req: any, res) => {
    try {
      const { projectId, path, content, language } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const file = await storage.createFile({
        projectId,
        path,
        content,
        language,
      });

      res.status(201).json(file);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

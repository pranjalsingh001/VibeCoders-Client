import { type User, type InsertUser, type Project, type InsertProject, type Workflow, type InsertWorkflow, type ProjectFile, type InsertFile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  
  // Workflows
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getWorkflowByProjectId(projectId: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined>;
  
  // Files
  getProjectFiles(projectId: string): Promise<ProjectFile[]>;
  createFile(file: InsertFile): Promise<ProjectFile>;
  updateFile(id: string, updates: Partial<ProjectFile>): Promise<ProjectFile | undefined>;
  deleteFile(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private workflows: Map<string, Workflow>;
  private files: Map<string, ProjectFile>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.workflows = new Map();
    this.files = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      status: "planning",
      techStack: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Workflows
  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async getWorkflowByProjectId(projectId: string): Promise<Workflow | undefined> {
    return Array.from(this.workflows.values()).find(workflow => workflow.projectId === projectId);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      stage: "planning",
      status: "idle",
      planningAnswers: null,
      blueprint: null,
      hld: null,
      lld: null,
      codegenPlan: null,
      files: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow = { ...workflow, ...updates, updatedAt: new Date() };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  // Files
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    return Array.from(this.files.values()).filter(file => file.projectId === projectId);
  }

  async createFile(insertFile: InsertFile): Promise<ProjectFile> {
    const id = randomUUID();
    const file: ProjectFile = {
      ...insertFile,
      id,
      language: insertFile.language || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: string, updates: Partial<ProjectFile>): Promise<ProjectFile | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...updates, updatedAt: new Date() };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: string): Promise<boolean> {
    return this.files.delete(id);
  }
}

export const storage = new MemStorage();

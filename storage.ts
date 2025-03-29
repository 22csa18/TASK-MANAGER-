import { 
  User, InsertUser, Task, InsertTask, Project, InsertProject, 
  ProjectMember, InsertProjectMember, Comment, InsertComment,
  Activity, InsertActivity, File, InsertFile
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define the interface for all storage CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByIds(ids: number[]): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getUserProjects(userId: number): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getProjectTasks(projectId: number): Promise<Task[]>;
  getUserTasks(userId: number): Promise<Task[]>;
  getAllTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Project member operations
  getProjectMembers(projectId: number): Promise<ProjectMember[]>;
  getUserProjectMemberships(userId: number): Promise<ProjectMember[]>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  removeProjectMember(projectId: number, userId: number): Promise<boolean>;

  // Comment operations
  getTaskComments(taskId: number): Promise<Comment[]>;
  getProjectComments(projectId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Activity operations
  getProjectActivities(projectId: number): Promise<Activity[]>;
  getUserActivities(userId: number): Promise<Activity[]>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // File operations
  getTaskFiles(taskId: number): Promise<File[]>;
  getProjectFiles(projectId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private projectMembers: Map<number, ProjectMember>;
  private comments: Map<number, Comment>;
  private activities: Map<number, Activity>;
  private files: Map<number, File>;
  sessionStore: session.SessionStore;

  private userIdCounter: number;
  private projectIdCounter: number;
  private taskIdCounter: number;
  private projectMemberIdCounter: number;
  private commentIdCounter: number;
  private activityIdCounter: number;
  private fileIdCounter: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.projectMembers = new Map();
    this.comments = new Map();
    this.activities = new Map();
    this.files = new Map();

    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.taskIdCounter = 1;
    this.projectMemberIdCounter = 1;
    this.commentIdCounter = 1;
    this.activityIdCounter = 1;
    this.fileIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUsersByIds(ids: number[]): Promise<User[]> {
    return ids
      .map(id => this.users.get(id))
      .filter(user => user !== undefined) as User[];
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    const memberships = Array.from(this.projectMembers.values())
      .filter(member => member.user_id === userId)
      .map(member => member.project_id);
    
    const ownedProjects = Array.from(this.projects.values())
      .filter(project => project.owner_id === userId);
    
    const memberProjects = memberships
      .map(projectId => this.projects.get(projectId))
      .filter(project => project !== undefined) as Project[];
    
    // Combine owned projects and projects the user is a member of
    return [...ownedProjects, ...memberProjects];
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const project: Project = { ...projectData, id };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = { ...project, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getProjectTasks(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.project_id === projectId);
  }

  async getUserTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assignee_id === userId);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const task: Task = { ...taskData, id };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Project member operations
  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return Array.from(this.projectMembers.values())
      .filter(member => member.project_id === projectId);
  }

  async getUserProjectMemberships(userId: number): Promise<ProjectMember[]> {
    return Array.from(this.projectMembers.values())
      .filter(member => member.user_id === userId);
  }

  async addProjectMember(memberData: InsertProjectMember): Promise<ProjectMember> {
    const id = this.projectMemberIdCounter++;
    const member: ProjectMember = { ...memberData, id };
    this.projectMembers.set(id, member);
    return member;
  }

  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    const memberToRemove = Array.from(this.projectMembers.values())
      .find(member => member.project_id === projectId && member.user_id === userId);
    
    if (memberToRemove) {
      return this.projectMembers.delete(memberToRemove.id);
    }
    return false;
  }

  // Comment operations
  async getTaskComments(taskId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.task_id === taskId);
  }

  async getProjectComments(projectId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.project_id === projectId);
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = { ...commentData, id, created_at: now };
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Activity operations
  async getProjectActivities(projectId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.project_id === projectId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async getUserActivities(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = { ...activityData, id, created_at: now };
    this.activities.set(id, activity);
    return activity;
  }

  // File operations
  async getTaskFiles(taskId: number): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.task_id === taskId);
  }

  async getProjectFiles(projectId: number): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.project_id === projectId);
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const now = new Date();
    const file: File = { ...fileData, id, uploaded_at: now };
    this.files.set(id, file);
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }
}

export const storage = new MemStorage();

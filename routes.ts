import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { handleChatRequest } from "./chatbot";
import { 
  insertProjectSchema, 
  insertTaskSchema, 
  insertProjectMemberSchema, 
  insertCommentSchema,
  insertActivitySchema,
  TaskStatus,
  ProjectStatus,
  UserRole
} from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      cb(null, uploadDir);
    },
    filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Role check middleware
function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Projects routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      // Log the incoming request body for debugging
      console.log("Project creation request body:", req.body);
      
      // Handle date fields properly
      const data = { ...req.body };
      
      // Convert deadline string to Date object if it exists
      if (data.deadline && typeof data.deadline === 'string') {
        try {
          data.deadline = new Date(data.deadline);
        } catch (error) {
          const dateError = error as Error;
          return res.status(400).json({ 
            message: `Invalid date format for deadline: ${dateError.message || "Unknown error"}` 
          });
        }
      }
      
      const validatedData = insertProjectSchema.parse({
        ...data,
        owner_id: req.user?.id
      });

      const project = await storage.createProject(validatedData);
      
      // Create an activity record
      await storage.createActivity({
        action: "create_project",
        description: `created project: ${project.name}`,
        user_id: req.user!.id,
        project_id: project.id
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create project" });
      }
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only owner or admin can update project
      if (project.owner_id !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Not project owner" });
      }
      
      // Handle date fields properly
      const data = { ...req.body };
      
      // Convert deadline string to Date object if it exists
      if (data.deadline && typeof data.deadline === 'string') {
        try {
          data.deadline = new Date(data.deadline);
        } catch (error) {
          const dateError = error as Error;
          return res.status(400).json({ 
            message: `Invalid date format for deadline: ${dateError.message || "Unknown error"}` 
          });
        }
      }
      
      const updatedProject = await storage.updateProject(projectId, data);
      
      await storage.createActivity({
        action: "update_project",
        description: `updated project: ${project.name}`,
        user_id: req.user!.id,
        project_id: project.id
      });
      
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update project" });
      }
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only owner or admin can delete project
      if (project.owner_id !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Not project owner" });
      }
      
      await storage.deleteProject(projectId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Project members routes
  app.get("/api/projects/:id/members", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const members = await storage.getProjectMembers(projectId);
      const memberIds = members.map(member => member.user_id);
      // Also include the project owner
      memberIds.push(project.owner_id);
      
      const uniqueIds = Array.from(new Set(memberIds));
      const users = await storage.getUsersByIds(uniqueIds);
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.post("/api/projects/:id/members", isAuthenticated, hasRole(["admin", "team_leader"]), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only owner or admin can add members
      if (project.owner_id !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Not project owner" });
      }
      
      const validatedData = insertProjectMemberSchema.parse({
        project_id: projectId,
        user_id: req.body.user_id
      });
      
      const member = await storage.addProjectMember(validatedData);
      const addedUser = await storage.getUser(req.body.user_id);
      
      await storage.createActivity({
        action: "add_member",
        description: `added ${addedUser?.name || 'a user'} to project: ${project.name}`,
        user_id: req.user!.id,
        project_id: project.id
      });
      
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to add project member" });
      }
    }
  });

  app.delete("/api/projects/:projectId/members/:userId", isAuthenticated, hasRole(["admin", "team_leader"]), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only owner or admin can remove members
      if (project.owner_id !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Not project owner" });
      }
      
      await storage.removeProjectMember(projectId, userId);
      const removedUser = await storage.getUser(userId);
      
      await storage.createActivity({
        action: "remove_member",
        description: `removed ${removedUser?.name || 'a user'} from project: ${project.name}`,
        user_id: req.user!.id,
        project_id: project.id
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove project member" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      let tasks;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;
      const userId = req.query.assigneeId ? parseInt(req.query.assigneeId as string) : null;
      
      if (projectId) {
        tasks = await storage.getProjectTasks(projectId);
      } else if (userId) {
        tasks = await storage.getUserTasks(userId);
      } else {
        // Return user's tasks by default
        tasks = await storage.getUserTasks(req.user!.id);
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const taskData = { ...req.body };
      
      // Convert deadline string to Date object if it exists
      if (taskData.deadline && typeof taskData.deadline === 'string') {
        try {
          taskData.deadline = new Date(taskData.deadline);
        } catch (error) {
          return res.status(400).json({ 
            message: "Invalid date format for deadline" 
          });
        }
      }
      
      const validatedData = insertTaskSchema.parse({
        ...taskData,
        creator_id: req.user?.id
      });
      
      const task = await storage.createTask(validatedData);
      
      await storage.createActivity({
        action: "create_task",
        description: `created task: ${task.title}`,
        user_id: req.user!.id,
        project_id: task.project_id,
        task_id: task.id
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const updatedData = { ...req.body };
      
      // Convert deadline string to Date object if it exists
      if (updatedData.deadline && typeof updatedData.deadline === 'string') {
        try {
          updatedData.deadline = new Date(updatedData.deadline);
        } catch (error) {
          return res.status(400).json({ 
            message: "Invalid date format for deadline" 
          });
        }
      }
      
      // If marking as completed
      if (updatedData.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
        updatedData.completed_at = new Date();
      }
      
      const updatedTask = await storage.updateTask(taskId, updatedData);
      
      await storage.createActivity({
        action: "update_task",
        description: `updated task: ${task.title}`,
        user_id: req.user!.id,
        project_id: task.project_id,
        task_id: task.id
      });
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const updatedData = { ...req.body };
      
      // Convert deadline string to Date object if it exists
      if (updatedData.deadline && typeof updatedData.deadline === 'string') {
        try {
          updatedData.deadline = new Date(updatedData.deadline);
        } catch (error) {
          return res.status(400).json({ 
            message: "Invalid date format for deadline" 
          });
        }
      }
      
      // If marking as completed
      if (updatedData.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
        updatedData.completed_at = new Date();
      }
      
      const updatedTask = await storage.updateTask(taskId, updatedData);
      
      await storage.createActivity({
        action: "update_task",
        description: `updated task: ${task.title}`,
        user_id: req.user!.id,
        project_id: task.project_id,
        task_id: task.id
      });
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only creator, project owner, or admin can delete tasks
      const project = await storage.getProject(task.project_id);
      if (task.creator_id !== req.user?.id && project?.owner_id !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions to delete this task" });
      }
      
      await storage.deleteTask(taskId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Comments routes
  app.get("/api/tasks/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const comments = await storage.getTaskComments(taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const validatedData = insertCommentSchema.parse({
        task_id: taskId,
        user_id: req.user!.id,
        content: req.body.content
      });
      
      const comment = await storage.createComment(validatedData);
      
      await storage.createActivity({
        action: "comment_task",
        description: `commented on task: ${task.title}`,
        user_id: req.user!.id,
        project_id: task.project_id,
        task_id: task.id
      });
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create comment" });
      }
    }
  });

  // File uploads routes
  app.post("/api/files/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { taskId, projectId } = req.body;
      
      // Validate that either taskId or projectId is provided
      if (!taskId && !projectId) {
        return res.status(400).json({ message: "Either taskId or projectId must be provided" });
      }
      
      // If taskId is provided, check that the task exists
      if (taskId) {
        const task = await storage.getTask(parseInt(taskId));
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
      }
      
      // If projectId is provided, check that the project exists
      if (projectId) {
        const project = await storage.getProject(parseInt(projectId));
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
      }
      
      const fileRecord = await storage.createFile({
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        type: req.file.mimetype,
        uploaded_by: req.user!.id,
        task_id: taskId ? parseInt(taskId) : undefined,
        project_id: projectId ? parseInt(projectId) : undefined
      });
      
      // Create activity record
      if (taskId) {
        const task = await storage.getTask(parseInt(taskId));
        await storage.createActivity({
          action: "upload_file",
          description: `uploaded file to task: ${task?.title}`,
          user_id: req.user!.id,
          project_id: task?.project_id,
          task_id: parseInt(taskId)
        });
      } else if (projectId) {
        const project = await storage.getProject(parseInt(projectId));
        await storage.createActivity({
          action: "upload_file",
          description: `uploaded file to project: ${project?.name}`,
          user_id: req.user!.id,
          project_id: parseInt(projectId)
        });
      }
      
      res.status(201).json(fileRecord);
    } catch (error) {
      console.error("File upload error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to upload file" });
      }
    }
  });

  app.get("/api/files", isAuthenticated, async (req, res) => {
    try {
      let files;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;
      const taskId = req.query.taskId ? parseInt(req.query.taskId as string) : null;
      
      if (projectId) {
        files = await storage.getProjectFiles(projectId);
      } else if (taskId) {
        files = await storage.getTaskFiles(taskId);
      } else {
        // Return all project files the user has access to
        const projects = await storage.getUserProjects(req.user!.id);
        const projectIds = projects.map(project => project.id);
        
        // Collect files from all projects
        const filesArray = await Promise.all(
          projectIds.map(id => storage.getProjectFiles(id))
        );
        
        // Flatten the array of arrays
        files = filesArray.flat();
      }
      
      // Enhance file objects with user information
      const userIds = Array.from(new Set(files.map(file => file.uploaded_by)));
      const users = await storage.getUsersByIds(userIds);
      
      const enhancedFiles = files.map(file => {
        const user = users.find(u => u.id === file.uploaded_by);
        return {
          ...file,
          uploader: user ? { id: user.id, name: user.name, username: user.username } : undefined
        };
      });
      
      res.json(enhancedFiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id", isAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.delete("/api/files/:id", isAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Only uploader or admin can delete files
      if (file.uploaded_by !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Not file owner" });
      }
      
      // Delete the physical file
      try {
        await fs.promises.unlink(file.path);
      } catch (error) {
        console.error("Error deleting physical file:", error);
      }
      
      // Delete the file record
      await storage.deleteFile(fileId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      
      let activities;
      
      if (projectId) {
        activities = await storage.getProjectActivities(projectId);
      } else if (userId) {
        activities = await storage.getUserActivities(userId);
      } else {
        activities = await storage.getRecentActivities(limit);
      }
      
      // Enhance activities with user information
      const userIds = Array.from(new Set(activities.map(activity => activity.user_id)));
      const users = await storage.getUsersByIds(userIds);
      
      const enhancedActivities = activities.map(activity => {
        const user = users.find(u => u.id === activity.user_id);
        return {
          ...activity,
          user: user ? { id: user.id, name: user.name, username: user.username, avatar: user.avatar } : undefined
        };
      });
      
      res.json(enhancedActivities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // API for AI chatbot
  app.post("/api/chatbot", isAuthenticated, handleChatRequest);
  
  // API for anonymous feedback
  app.post("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      // We're storing feedback as an activity in this simplified version
      const { category, type, content } = req.body;
      
      if (!category || !type || !content) {
        return res.status(400).json({
          message: "Missing required fields: category, type, and content are required"
        });
      }
      
      // Create an activity with anonymized user data
      const feedback = await storage.createActivity({
        action: "anonymous_feedback",
        description: `Feedback - ${category}/${type}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        user_id: -1, // Use -1 to indicate anonymous (this will need to be handled in the UI)
      });
      
      res.status(201).json({
        id: feedback.id,
        date: feedback.created_at,
        status: "pending",
        category,
        type,
        preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      });
    } catch (error) {
      console.error("Feedback submission error:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
import { User, Project, Task, Comment, File } from "@shared/schema";

// Define types for API responses that include relations
export interface ProjectWithStats extends Project {
  taskCount?: number;
  completedTaskCount?: number;
  memberCount?: number;
}

export interface TaskWithRelations extends Task {
  project?: Project;
  assignee?: User;
  creator?: User;
  comments?: Comment[];
  files?: File[];
}

export interface ProjectWithMembers extends Project {
  members?: User[];
  tasks?: Task[];
}

export interface UserWithTasks extends User {
  assignedTasks?: Task[];
}

// Types for dashboard statistics
export interface DashboardStats {
  totalProjects: number;
  tasksInProgress: number;
  completedTasks: number;
  teamMembers: number;
  newProjectsThisMonth: number;
  dueSoonTasks: number;
  completedTasksThisWeek: number;
  onlineUsers: number;
}

// Types for activity feeds
export interface ActivityWithUser {
  id: number;
  action: string;
  description: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  project_id?: number;
  task_id?: number;
}

// Type for the filter options used in tasks
export type TaskFilter = 'all' | 'todo' | 'in_progress' | 'review' | 'completed';

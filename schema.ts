import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export enum UserRole {
  ADMIN = "admin",
  TEAM_LEADER = "team_leader",
  TEAM_MEMBER = "team_member",
  CLIENT = "client"
}

// Task statuses
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  COMPLETED = "completed"
}

// Task priorities
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

// Project statuses
export enum ProjectStatus {
  PLANNING = "planning",
  ON_TRACK = "on_track",
  AT_RISK = "at_risk",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").$type<UserRole>().notNull().default(UserRole.TEAM_MEMBER),
  avatar: text("avatar"),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").$type<ProjectStatus>().notNull().default(ProjectStatus.PLANNING),
  deadline: timestamp("deadline"),
  owner_id: integer("owner_id").notNull().references(() => users.id),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").$type<TaskStatus>().notNull().default(TaskStatus.TODO),
  priority: text("priority").$type<TaskPriority>().notNull().default(TaskPriority.MEDIUM),
  deadline: timestamp("deadline"),
  project_id: integer("project_id").notNull().references(() => projects.id),
  assignee_id: integer("assignee_id").references(() => users.id),
  creator_id: integer("creator_id").notNull().references(() => users.id),
  completed_at: timestamp("completed_at"),
});

// Project members table (many-to-many relationship between users and projects)
export const project_members = pgTable("project_members", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").notNull().references(() => projects.id),
  user_id: integer("user_id").notNull().references(() => users.id),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  task_id: integer("task_id").references(() => tasks.id),
  project_id: integer("project_id").references(() => projects.id),
  user_id: integer("user_id").notNull().references(() => users.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Activity log table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  description: text("description").notNull(),
  user_id: integer("user_id").notNull().references(() => users.id),
  project_id: integer("project_id").references(() => projects.id),
  task_id: integer("task_id").references(() => tasks.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  size: integer("size").notNull(),
  mimetype: text("mimetype").notNull(),
  project_id: integer("project_id").references(() => projects.id),
  task_id: integer("task_id").references(() => tasks.id),
  uploader_id: integer("uploader_id").notNull().references(() => users.id),
  uploaded_at: timestamp("uploaded_at").notNull().defaultNow(),
});

// Create Zod schemas for insertions
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  status: true,
  deadline: true,
  owner_id: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  deadline: true,
  project_id: true,
  assignee_id: true,
  creator_id: true,
});

export const insertProjectMemberSchema = createInsertSchema(project_members).pick({
  project_id: true,
  user_id: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  task_id: true, 
  project_id: true,
  user_id: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  action: true,
  description: true,
  user_id: true,
  project_id: true,
  task_id: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  filename: true,
  filepath: true,
  size: true,
  mimetype: true,
  project_id: true,
  task_id: true,
  uploader_id: true,
});

// Type definitions for CRUD operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type ProjectMember = typeof project_members.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Project, Task, TaskStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ProjectCard } from "../ui/project-card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ProjectListProps {
  userId?: number;
  limit?: number;
  viewMode?: "grid" | "table";
  onAddProject?: () => void;
}

export function ProjectList({
  userId,
  limit,
  viewMode = "grid",
  onAddProject,
}: ProjectListProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { userId }],
    queryFn: async () => {
      let url = "/api/projects";
      if (userId) {
        url += `?userId=${userId}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });
  
  // Fetch all tasks to calculate progress
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/all"],
    queryFn: async () => {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });
  
  // Get the limited list of projects
  const displayProjects = limit ? projects.slice(0, limit) : projects;
  
  // Calculate task stats for each project
  const projectStats = displayProjects.map(project => {
    const projectTasks = allTasks.filter(task => task.project_id === project.id);
    const completedTasks = projectTasks.filter(task => task.status === TaskStatus.COMPLETED);
    
    return {
      project,
      taskCount: projectTasks.length,
      completedTaskCount: completedTasks.length
    };
  });
  
  const handleViewProject = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };
  
  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  if (displayProjects.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg bg-white">
        <h3 className="text-lg font-medium text-gray-700 mb-2">No projects found</h3>
        <p className="text-gray-500 mb-4">Get started by creating your first project.</p>
        {onAddProject && (
          <Button onClick={onAddProject}>Create Project</Button>
        )}
      </div>
    );
  }
  
  return (
    <div>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectStats.map(({ project, taskCount, completedTaskCount }) => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={taskCount}
              completedTaskCount={completedTaskCount}
              onViewProject={handleViewProject}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectStats.map(({ project, taskCount, completedTaskCount }) => {
                const progressPercentage = taskCount > 0 
                  ? Math.round((completedTaskCount / taskCount) * 100) 
                  : 0;
                
                return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center">
                          {/* Icon would be here */}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">{taskCount} tasks</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500">{progressPercentage}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="link" 
                        onClick={() => handleViewProject(project.id)} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

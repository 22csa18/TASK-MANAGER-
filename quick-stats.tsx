import { useQuery } from "@tanstack/react-query";
import { Task, Project, TaskStatus } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, Clock, CheckCircle, Users, TrendingUp, ArrowUp } from "lucide-react";

export function QuickStats() {
  // Fetch all projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  // Fetch all tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/all"],
    queryFn: async () => {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  // Calculate stats
  const totalProjects = projects.length;
  const tasksInProgress = tasks.filter(
    (task) => task.status === TaskStatus.IN_PROGRESS
  ).length;
  const completedTasks = tasks.filter(
    (task) => task.status === TaskStatus.COMPLETED
  ).length;

  // These would be dynamic in a real application with user data
  const teamMembersCount = 8;
  const onlineUsersCount = 2;
  const newProjectsThisMonth = 2;
  const dueSoonTasks = 5;
  const completedTasksThisWeek = 12;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 font-medium">Total Projects</div>
              <div className="text-2xl font-bold text-gray-800">{totalProjects}</div>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600">
              <Folder className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <ArrowUp className="h-3 w-3 mr-1" />
            <span>{newProjectsThisMonth} new this month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 font-medium">Tasks In Progress</div>
              <div className="text-2xl font-bold text-gray-800">{tasksInProgress}</div>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-md flex items-center justify-center text-orange-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <span>{dueSoonTasks} due soon</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 font-medium">Completed Tasks</div>
              <div className="text-2xl font-bold text-gray-800">{completedTasks}</div>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <ArrowUp className="h-3 w-3 mr-1" />
            <span>{completedTasksThisWeek} this week</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 font-medium">Team Members</div>
              <div className="text-2xl font-bold text-gray-800">{teamMembersCount}</div>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <span>{onlineUsersCount} online now</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TaskCard } from "@/components/ui/task-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Task, TaskStatus } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface TaskListProps {
  userId?: number;
  projectId?: number;
  limit?: number;
  showFilter?: boolean;
  showAddButton?: boolean;
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
}

export function TaskList({
  userId,
  projectId,
  limit,
  showFilter = true,
  showAddButton = true,
  onAddTask,
  onEditTask,
}: TaskListProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { projectId, userId }],
    queryFn: async () => {
      let url = "/api/tasks";
      const params = new URLSearchParams();
      
      if (projectId) params.append("projectId", projectId.toString());
      if (userId) params.append("assigneeId", userId.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the task",
        variant: "destructive",
      });
    },
  });

  // Filter tasks based on selected filter
  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "all") return true;
      if (filter === "completed") return task.status === TaskStatus.COMPLETED;
      if (filter === "in_progress") return task.status === TaskStatus.IN_PROGRESS;
      if (filter === "todo") return task.status === TaskStatus.TODO;
      return true;
    })
    .slice(0, limit);

  const handleDeleteTask = (taskId: number) => {
    setTaskToDelete(taskId);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete);
      setTaskToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-200">
          <CardTitle className="text-lg font-bold text-gray-700">My Tasks</CardTitle>
          <div className="flex items-center space-x-2">
            {showFilter && (
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="text-sm py-1 px-2 h-8 w-[130px] border-gray-200">
                  <SelectValue placeholder="All Tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
            {showAddButton && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onAddTask}
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No tasks found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
          
          {limit && tasks.length > limit && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="link"
                className="w-full py-2 text-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View All Tasks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={taskToDelete !== null} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              {deleteTaskMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

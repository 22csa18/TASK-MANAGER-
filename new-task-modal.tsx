import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Task, TaskPriority, TaskStatus, Project, User } from "@shared/schema";

import { Loader2, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define interface for task data sent to API
interface TaskSubmitData extends Omit<Partial<Task>, 'deadline'> {
  deadline?: string | null;
}

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task;
}

export function NewTaskModal({ isOpen, onClose, initialTask }: NewTaskModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState<number | null | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    enabled: isOpen,
  });

  // Fetch team members for assignee dropdown
  const { data: teamMembers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch team members");
      return res.json();
    },
    enabled: isOpen,
  });

  // Create/Update task mutation
  const mutation = useMutation({
    mutationFn: async (taskData: TaskSubmitData) => {
      if (initialTask) {
        // Update existing task
        const res = await apiRequest("PATCH", `/api/tasks/${initialTask.id}`, taskData);
        return res.json();
      } else {
        // Create new task
        const res = await apiRequest("POST", "/api/tasks", taskData);
        return res.json();
      }
    },
    onSuccess: () => {
      // Invalidate tasks queries to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: initialTask ? "Task updated" : "Task created",
        description: initialTask 
          ? "The task has been updated successfully." 
          : "The new task has been created successfully.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${initialTask ? "update" : "create"} task: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Set form values when editing a task
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || "");
      setProjectId(initialTask.project_id);
      setAssigneeId(initialTask.assignee_id);
      setPriority(initialTask.priority as TaskPriority);
      setStatus(initialTask.status as TaskStatus);
      setDueDate(initialTask.deadline ? new Date(initialTask.deadline) : undefined);
    } else {
      // Default values for new task
      setTitle("");
      setDescription("");
      setProjectId(undefined);
      setAssigneeId(user?.id);
      setPriority(TaskPriority.MEDIUM);
      setStatus(TaskStatus.TODO);
      setDueDate(undefined);
    }
  }, [initialTask, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const taskData: TaskSubmitData = {
      title,
      description: description || null,
      project_id: projectId,
      assignee_id: assigneeId,
      priority,
      status,
      deadline: dueDate ? dueDate.toISOString() : null,
      creator_id: initialTask?.creator_id || user?.id,
    };
    
    mutation.mutate(taskData);
  };

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{initialTask ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={projectId?.toString()}
                onValueChange={(value) => setProjectId(parseInt(value))}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="no-projects" disabled>
                      No projects available
                    </SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={assigneeId?.toString()}
                onValueChange={(value) => setAssigneeId(parseInt(value))}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.length === 0 ? (
                    <SelectItem value="no-members" disabled>
                      No team members available
                    </SelectItem>
                  ) : (
                    teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.REVIEW}>In Review</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="due-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialTask ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
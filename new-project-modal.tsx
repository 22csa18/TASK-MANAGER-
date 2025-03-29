import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Project, ProjectStatus, insertProjectSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

// Create a form schema that extends the insert schema
const formSchema = insertProjectSchema.extend({
  deadline: z.date().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

export function NewProjectModal({ isOpen, onClose, project }: NewProjectModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Initialize the form with react-hook-form and zod validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: ProjectStatus.PLANNING,
      deadline: undefined,
      owner_id: user?.id
    }
  });

  // Reset form when modal opens or project changes
  useEffect(() => {
    if (isOpen) {
      if (project) {
        form.reset({
          name: project.name,
          description: project.description || "",
          status: project.status as ProjectStatus,
          deadline: project.deadline ? new Date(project.deadline) : undefined,
          owner_id: project.owner_id
        });
      } else {
        form.reset({
          name: "",
          description: "",
          status: ProjectStatus.PLANNING,
          deadline: undefined,
          owner_id: user?.id
        });
      }
    }
  }, [isOpen, project, form, user?.id]);

  // Create or update project mutation
  const projectMutation = useMutation({
    mutationFn: async (projectData: FormData) => {
      // Convert date to ISO string for the API
      const apiData = {
        ...projectData,
        deadline: projectData.deadline ? projectData.deadline.toISOString() : undefined,
      };
      
      if (project) {
        await apiRequest("PUT", `/api/projects/${project.id}`, apiData);
      } else {
        await apiRequest("POST", "/api/projects", apiData);
      }
    },
    onSuccess: () => {
      toast({
        title: project ? "Project updated" : "Project created",
        description: project ? "The project has been updated successfully" : "A new project has been created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onClose();
    },
    onError: (error) => {
      console.error("Project mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to ${project ? "update" : "create"} project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Form data:", data);
    projectMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="Enter project name"
              {...form.register("name")}
              aria-invalid={form.formState.errors.name ? "true" : "false"}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as ProjectStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
                  <SelectItem value={ProjectStatus.ON_TRACK}>On Track</SelectItem>
                  <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={ProjectStatus.AT_RISK}>At Risk</SelectItem>
                  <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("deadline") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("deadline") 
                      ? format(form.watch("deadline") as Date, "PPP") 
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("deadline") as Date | undefined}
                    onSelect={(date) => {
                      form.setValue("deadline", date);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={projectMutation.isPending || form.formState.isSubmitting}>
              {projectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {project ? "Update Project" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

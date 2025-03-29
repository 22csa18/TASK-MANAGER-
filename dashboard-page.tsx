import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { TaskList } from "@/components/dashboard/task-list";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ProjectList } from "@/components/dashboard/project-list";
import { useAuth } from "@/hooks/use-auth";
import { NewTaskModal } from "@/components/modals/new-task-modal";
import { NewProjectModal } from "@/components/modals/new-project-modal";
import { Button } from "@/components/ui/button";
import { PlusIcon, Loader2 } from "lucide-react";
import { Task } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);

  const openNewTaskModal = () => {
    setTaskToEdit(undefined);
    setNewTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setTaskToEdit(task);
    setNewTaskModalOpen(true);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-700">Dashboard</h1>
          
          <div className="flex items-center space-x-2 mt-3 md:mt-0">
            <Button 
              onClick={() => setNewProjectModalOpen(true)}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              <span>New Project</span>
            </Button>
            <Button 
              onClick={openNewTaskModal}
              variant="outline" 
              className="inline-flex items-center border-gray-200 text-gray-700"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
        </div>
        
        <QuickStats />
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <TaskList 
            userId={user.id} 
            limit={5} 
            onAddTask={openNewTaskModal} 
            onEditTask={openEditTaskModal} 
          />
        </div>
        
        <div className="lg:w-1/3 space-y-6">
          <UpcomingDeadlines />
          <RecentActivity />
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-700">Projects Overview</h2>
        </div>
        
        <ProjectList 
          limit={3} 
          viewMode="grid" 
          onAddProject={() => setNewProjectModalOpen(true)} 
        />
      </div>
      
      {/* Modals */}
      <NewTaskModal 
        isOpen={newTaskModalOpen} 
        onClose={() => setNewTaskModalOpen(false)} 
        initialTask={taskToEdit}
      />
      
      <NewProjectModal 
        isOpen={newProjectModalOpen} 
        onClose={() => setNewProjectModalOpen(false)} 
      />
    </MainLayout>
  );
}

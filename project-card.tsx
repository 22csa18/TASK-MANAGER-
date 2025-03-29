import { Project, ProjectStatus } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Globe, Smartphone, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ProjectCardProps {
  project: Project;
  members?: { id: number; name: string; avatar?: string }[];
  taskCount?: number;
  completedTaskCount?: number;
  onViewProject?: (projectId: number) => void;
}

export function ProjectCard({
  project,
  members = [],
  taskCount = 0,
  completedTaskCount = 0,
  onViewProject
}: ProjectCardProps) {
  // Calculate progress percentage
  const progressPercentage = taskCount > 0 
    ? Math.round((completedTaskCount / taskCount) * 100) 
    : 0;

  // Project status badge color
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ON_TRACK:
        return "bg-green-50 text-green-600 border-green-200";
      case ProjectStatus.AT_RISK:
        return "bg-red-50 text-red-600 border-red-200";
      case ProjectStatus.IN_PROGRESS:
        return "bg-orange-50 text-orange-600 border-orange-200";
      case ProjectStatus.COMPLETED:
        return "bg-blue-50 text-blue-600 border-blue-200";
      case ProjectStatus.PLANNING:
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // Project icon based on name (this is a simple implementation, can be improved)
  const getProjectIcon = () => {
    const name = project.name.toLowerCase();
    
    if (name.includes('website') || name.includes('web')) {
      return <Globe className="h-5 w-5" />;
    } else if (name.includes('app') || name.includes('mobile')) {
      return <Smartphone className="h-5 w-5" />;
    } else {
      return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center mr-4">
              {getProjectIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
              <p className="text-sm text-gray-500">{taskCount} tasks</p>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(project.status as ProjectStatus)}>
            {project.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Badge>
        </div>
        
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
        )}
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-xs font-medium text-gray-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            {project.deadline && (
              <div className="text-xs text-gray-500">
                Due: {format(new Date(project.deadline), "MMM dd, yyyy")}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {members.length > 0 && (
              <AvatarGroup users={members} limit={3} />
            )}
            
            {onViewProject && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => onViewProject(project.id)} 
                className="text-indigo-600 p-0 hover:text-indigo-800"
              >
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

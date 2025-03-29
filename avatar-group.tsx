import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface User {
  id: number;
  name: string;
  avatar?: string;
}

interface AvatarGroupProps {
  users: User[];
  limit?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({ users, limit = 3, size = "md" }: AvatarGroupProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  const avatarClass = sizeClasses[size];
  const displayUsers = users.slice(0, limit);
  const remainingCount = users.length - limit;

  // Generate initials from a name (first letter of first and last name)
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generate a consistent color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
    ];
    
    // Simple hash function to get consistent colors
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex -space-x-2">
      <TooltipProvider>
        {displayUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar className={`${avatarClass} border-2 border-white`}>
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : null}
                <AvatarFallback className={getAvatarColor(user.name)}>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className={`${avatarClass} border-2 border-white bg-gray-300 text-gray-600`}>
                <AvatarFallback>+{remainingCount}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more team members</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

type ActivityWithUser = {
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
};

export function RecentActivity({ limit = 5 }) {
  // Fetch recent activities
  const { data: activities = [], isLoading } = useQuery<ActivityWithUser[]>({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const res = await fetch(`/api/activities?limit=${limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  // Get initials from name
  const getInitials = (name: string = "") => {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generate a color based on name/username
  const getAvatarColor = (name: string = "") => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 border-b border-gray-200">
        <CardTitle className="text-lg font-bold text-gray-700">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-gray-200 max-h-[240px] overflow-y-auto">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No recent activities</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <Avatar className={`h-8 w-8 ${getAvatarColor(activity.user?.name || "")}`}>
                  <AvatarFallback>
                    {getInitials(activity.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">{activity.user?.name}</span>
                    <span className="text-gray-500">{" "}{activity.description}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {activity.created_at &&
                      formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

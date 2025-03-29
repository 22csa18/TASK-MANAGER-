import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, addDays, isAfter } from "date-fns";
import { Task, TaskStatus } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingDeadlines({ limit = 3 }) {
  // Fetch tasks with deadlines
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  // Filter tasks with deadlines that are in the future or today
  const now = new Date();
  const upcomingDeadlines = tasks
    .filter(
      (task) => 
        task.deadline && 
        (isToday(new Date(task.deadline)) || isAfter(new Date(task.deadline), now)) &&
        task.status !== TaskStatus.COMPLETED
    )
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, limit);

  const getDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return "Today";
    } else if (isTomorrow(date)) {
      return "Tomorrow";
    } else if (isAfter(date, now) && isAfter(addDays(now, 7), date)) {
      return format(date, "EEEE"); // Day name
    } else {
      return format(date, "MMM d");
    }
  };

  const getBadgeForDeadline = (dateStr: string) => {
    const date = new Date(dateStr);
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 1) {
      return <Badge variant="destructive">Urgent</Badge>;
    } else if (daysUntil <= 3) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Soon</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Upcoming</Badge>;
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 border-b border-gray-200">
        <CardTitle className="text-lg font-bold text-gray-700">Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-gray-200 max-h-[240px] overflow-y-auto">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))
        ) : upcomingDeadlines.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No upcoming deadlines</p>
          </div>
        ) : (
          upcomingDeadlines.map((task) => (
            <div key={task.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700">{task.title}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {getDateDisplay(task.deadline!)}
                      {isToday(new Date(task.deadline!)) && (
                        <span>, {format(new Date(task.deadline!), "h:mm a")}</span>
                      )}
                    </span>
                  </div>
                </div>
                {task.deadline && getBadgeForDeadline(task.deadline)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

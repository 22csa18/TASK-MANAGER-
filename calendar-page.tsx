import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Sample events for demonstration purposes
  const events = [
    {
      id: 1,
      title: "Project Kickoff",
      date: new Date(),
      project: "Website Redesign",
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    {
      id: 2,
      title: "Client Meeting",
      date: addDays(new Date(), 2),
      project: "Mobile App",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    {
      id: 3,
      title: "Design Review",
      date: addDays(new Date(), 3),
      project: "Website Redesign",
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    {
      id: 4,
      title: "Team Standup",
      date: addDays(new Date(), 1),
      project: "CRM Integration",
      color: "bg-green-100 text-green-700 border-green-200",
    },
    {
      id: 5,
      title: "Deadline: Phase 1",
      date: addDays(new Date(), 7),
      project: "Website Redesign",
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
  ];

  // Function to check if a date has events
  const dateHasEvents = (day: Date) => {
    return events.some(event => 
      event.date.getDate() === day.getDate() && 
      event.date.getMonth() === day.getMonth() && 
      event.date.getFullYear() === day.getFullYear()
    );
  };

  // Get events for the selected date
  const getEventsForDate = (date?: Date) => {
    if (!date) return [];
    return events.filter(event => 
      event.date.getDate() === date.getDate() && 
      event.date.getMonth() === date.getMonth() && 
      event.date.getFullYear() === date.getFullYear()
    );
  };

  // Get upcoming events (next 5 days)
  const getUpcomingEvents = () => {
    const today = new Date();
    const fiveDaysLater = addDays(today, 5);
    return events.filter(event => 
      event.date >= today && event.date <= fiveDaysLater
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "MMMM d, yyyy");
  };

  // Selected date events
  const selectedDateEvents = getEventsForDate(date);
  
  // Upcoming events
  const upcomingEvents = getUpcomingEvents();

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Calendar</h1>
            <p className="text-gray-500">View and manage your schedule</p>
          </div>
          <Button>
            <CalendarPlus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border"
                modifiersClassNames={{
                  selected: "bg-indigo-100 text-indigo-900 font-medium",
                }}
                components={{
                  DayContent: (props) => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {props.date.getDate()}
                      {dateHasEvents(props.date) && (
                        <div className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full"></div>
                      )}
                    </div>
                  ),
                }}
              />
            </CardContent>
          </Card>
          
          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No upcoming events in the next 5 days</p>
                  </div>
                ) : (
                  upcomingEvents.map(event => (
                    <div key={event.id} className="flex flex-col space-y-1 pb-3 border-b last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{event.title}</div>
                        <Badge variant="outline">{format(event.date, "MMM d")}</Badge>
                      </div>
                      <div className="text-sm text-gray-500">{event.project}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Events for Selected Date */}
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-4">
            Events for {date ? formatDate(date) : "Today"}
          </h2>
          
          {selectedDateEvents.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <p>No events scheduled for this date</p>
                  <Button variant="link" className="mt-2">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Add New Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDateEvents.map(event => (
                <Card key={event.id} className={`border-l-4 ${event.color.split(" ")[0]}`}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{event.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="secondary">{event.project}</Badge>
                      <span className="text-sm text-gray-500">9:00 AM</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
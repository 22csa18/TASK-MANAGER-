import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/hooks/use-sidebar";
import { Menu, ArrowLeft, ArrowRight, Search, Bell, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

export function Topbar() {
  const { setIsOpen, isMobile } = useSidebar();
  const [location, navigate] = useLocation();
  const [hasNotifications, setHasNotifications] = useState(true);
  const [hasMessages, setHasMessages] = useState(true);

  // Handle navigation with browser history
  const handleBack = () => {
    window.history.back();
  };

  const handleForward = () => {
    window.history.forward();
  };

  // Get page title based on current location
  const getPageTitle = () => {
    const path = location;
    
    if (path === "/") return "Dashboard";
    if (path.startsWith("/projects/")) return "Project Details";
    if (path === "/projects") return "Projects";
    if (path === "/tasks") return "My Tasks";
    if (path === "/team") return "Team Members";
    if (path === "/messages") return "Messages";
    if (path === "/files") return "Files";
    if (path === "/calendar") return "Calendar";
    if (path === "/settings") return "Settings";
    
    return "TaskCollab";
  };

  return (
    <header className="bg-white shadow-sm z-20 sticky top-0">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {isMobile && (
            <h1 className="text-xl font-bold text-indigo-600">TaskCollab</h1>
          )}
          
          {!isMobile && (
            <div className="hidden md:flex items-center space-x-1 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleForward}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <h1 className="text-lg font-semibold text-gray-700 ml-2">
                {getPageTitle()}
              </h1>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 focus:bg-white"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-500 hover:text-gray-700"
          >
            <Bell className="h-5 w-5" />
            {hasNotifications && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-500 hover:text-gray-700"
          >
            <MessageSquare className="h-5 w-5" />
            {hasMessages && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

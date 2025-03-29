import { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Add a class to the body when the component mounts
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    
    // Clean up when component unmounts
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);
  
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

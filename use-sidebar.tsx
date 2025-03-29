import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if on mobile initially
    checkIfMobile();

    // Listen for window resize events
    window.addEventListener('resize', checkIfMobile);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  function checkIfMobile() {
    setIsMobile(window.innerWidth < 768);
    
    // Auto-close sidebar on mobile, open on desktop
    if (window.innerWidth < 768) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  
  return context;
}

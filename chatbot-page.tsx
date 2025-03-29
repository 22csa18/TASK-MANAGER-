import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Send, Bot, Loader2, ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Message = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
};

export default function ChatbotPage() {
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-message",
      content: "Hello! I'm TaskCollab AI Assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Sample AI responses for demonstration
  const sampleResponses = [
    "I can help you prioritize your tasks based on deadlines and importance.",
    "Based on your current workload, I suggest focusing on the Website Redesign project first.",
    "I've analyzed your team's performance. The development team has completed 85% of their assigned tasks this sprint.",
    "Here's a summary of your upcoming deadlines: 3 tasks due tomorrow, 5 tasks due this week.",
    "I notice you have several overlapping meetings next week. Would you like me to suggest some rescheduling options?",
    "Your most active project this month is the Mobile App project with 24 completed tasks.",
    "I can help you draft a progress report for your current project. Would you like me to do that?",
    "Based on past performance, I estimate this task will take approximately 4-5 days to complete.",
  ];

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate sending a message to the AI assistant
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    
    // Simulate AI thinking and responding
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        content: sampleResponses[Math.floor(Math.random() * sampleResponses.length)],
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "?";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
          <p className="text-gray-500">Get intelligent help with your tasks and projects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Chat Area - Takes 3/4 of the width on larger screens */}
          <Card className="md:col-span-3 flex flex-col h-[calc(100vh-200px)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Avatar className="h-8 w-8 mr-2 bg-indigo-100">
                  <AvatarFallback className="text-indigo-600">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                TaskCollab AI
              </CardTitle>
              <CardDescription>
                Your intelligent assistant for task management and productivity
              </CardDescription>
            </CardHeader>
            
            {/* Messages Container */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex ${message.sender === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-2 max-w-[80%]`}>
                    {message.sender === "ai" ? (
                      <Avatar className="h-8 w-8 mt-1 bg-indigo-100">
                        <AvatarFallback className="text-indigo-600">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-8 w-8 mt-1 bg-indigo-100 text-indigo-600">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        message.sender === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-900 rounded-tl-none"
                      }`}
                    >
                      {message.content}
                      <div className={`text-xs mt-1 ${message.sender === "user" ? "text-indigo-200" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* AI Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <Avatar className="h-8 w-8 mt-1 bg-indigo-100">
                      <AvatarFallback className="text-indigo-600">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-gray-100 text-gray-900 rounded-tl-none">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </CardContent>
            
            {/* Input Area */}
            <div className="p-4 border-t mt-auto">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Suggestions Panel - Takes 1/4 of the width on larger screens */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle>Suggestions</CardTitle>
              <CardDescription>Quick prompts for the AI assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tasks">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tasks" className="space-y-2 mt-4">
                  {["Prioritize my tasks", "Suggest a schedule", "Draft a project update", "Estimate task completion", "Find bottlenecks"].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => {
                        setInputMessage(suggestion);
                      }}
                    >
                      {suggestion}
                      <ChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                  ))}
                </TabsContent>
                
                <TabsContent value="insights" className="space-y-2 mt-4">
                  {["Team performance analysis", "Project progress summary", "Productivity trends", "Workload distribution", "Deadline risk assessment"].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => {
                        setInputMessage(suggestion);
                      }}
                    >
                      {suggestion}
                      <ChevronDown className="ml-auto h-4 w-4" />
                    </Button>
                  ))}
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 p-3 bg-gray-100 rounded-lg text-sm text-gray-500">
                <p className="font-medium text-gray-700 mb-1">About TaskCollab AI</p>
                <p className="mb-2">
                  This AI assistant can help you manage tasks, analyze project progress, and provide productivity insights.
                </p>
                <p>
                  Note: In a production environment, this would connect to a real AI service.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
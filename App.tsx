import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProjectPage from "@/pages/project-page";
import TasksPage from "@/pages/tasks-page";
import TeamPage from "@/pages/team-page";
import MessagesPage from "@/pages/messages-page";
import FilesPage from "@/pages/files-page";
import CalendarPage from "@/pages/calendar-page";
import SettingsPage from "@/pages/settings-page";
import ChatbotPage from "@/pages/chatbot-page";
import FeedbackPage from "@/pages/feedback-page";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/projects" component={ProjectPage} />
      <ProtectedRoute path="/projects/:id" component={ProjectPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/team" component={TeamPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/files" component={FilesPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/chatbot" component={ChatbotPage} />
      <ProtectedRoute path="/feedback" component={FeedbackPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;

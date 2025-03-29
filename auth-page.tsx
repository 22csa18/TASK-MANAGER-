import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Loader2 } from "lucide-react";
import { UserRole } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>(UserRole.TEAM_MEMBER);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      console.log("User authenticated, redirecting to dashboard");
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: loginUsername,
      password: loginPassword,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      username: registerUsername,
      password: registerPassword,
      name: registerName,
      email: registerEmail,
      role: registerRole,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl flex flex-col md:flex-row shadow-lg rounded-lg overflow-hidden">
        {/* Left side - Auth forms */}
        <div className="w-full md:w-1/2 bg-white p-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <CheckSquare className="h-6 w-6 text-indigo-600 mr-2" />
              <h1 className="text-2xl font-bold text-indigo-600">TaskCollab</h1>
            </div>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Choose a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-role">Role</Label>
                  <Select
                    value={registerRole}
                    onValueChange={(value) => setRegisterRole(value as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
                      <SelectItem value={UserRole.TEAM_LEADER}>Team Leader</SelectItem>
                      <SelectItem value={UserRole.TEAM_MEMBER}>Team Member</SelectItem>
                      <SelectItem value={UserRole.CLIENT}>Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Hero section */}
        <div className="w-full md:w-1/2 bg-indigo-600 p-8 text-white hidden md:block">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">
              Collaborate, Organize, Succeed
            </h2>
            <p className="mb-6 opacity-90">
              TaskCollab helps teams organize, assign, and track tasks effectively.
              Streamline your workflows and boost productivity with our intuitive
              task management platform.
            </p>
            <ul className="space-y-2 opacity-90">
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Create and assign tasks to team members</span>
              </li>
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Track project progress with status updates</span>
              </li>
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Collaborate with real-time messaging</span>
              </li>
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Share files and documents with your team</span>
              </li>
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Get notifications for important updates</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

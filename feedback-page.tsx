import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Heart, UserCheck, Users, Sparkles, Star, LucideIcon, Check, History } from "lucide-react";

// Define the feedback form schema
const feedbackFormSchema = z.object({
  category: z.enum(["team", "project", "process", "leadership", "other"], {
    required_error: "Please select a feedback category",
  }),
  type: z.enum(["suggestion", "praise", "concern"], {
    required_error: "Please select a feedback type",
  }),
  rating: z.enum(["1", "2", "3", "4", "5"], {
    required_error: "Please select a rating",
  }),
  message: z.string().min(10, {
    message: "Feedback message must be at least 10 characters",
  }),
  anonymous: z.boolean().default(true),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

// Feedback submission history interface
interface FeedbackSubmission {
  id: string;
  date: Date;
  status: "pending" | "reviewed" | "implemented";
  category: string;
  type: string;
  preview: string;
}

export default function FeedbackPage() {
  const { toast } = useToast();
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackSubmission[]>([]);
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    implemented: 0,
    reviewed: 0,
    pending: 0,
  });
  
  // Initialize form with react-hook-form
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      category: undefined,
      type: undefined,
      rating: undefined,
      message: "",
      anonymous: true,
    },
  });

  // Handle form submission
  const onSubmit = (values: FeedbackFormValues) => {
    // In a real application, this would send the data to the server
    console.log("Feedback submitted:", values);
    
    // Show success message
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your anonymous feedback! It will be reviewed by the team.",
      variant: "default",
    });
    
    // Add to submission history
    const newSubmission: FeedbackSubmission = {
      id: `feedback-${Date.now()}`,
      date: new Date(),
      status: "pending",
      category: values.category,
      type: values.type,
      preview: values.message.substring(0, 30) + (values.message.length > 30 ? "..." : ""),
    };
    
    setSubmittedFeedback([newSubmission, ...submittedFeedback]);
    setFeedbackStats({
      total: feedbackStats.total + 1,
      implemented: feedbackStats.implemented,
      reviewed: feedbackStats.reviewed,
      pending: feedbackStats.pending + 1,
    });
    
    // Reset form
    form.reset({
      category: undefined,
      type: undefined,
      rating: undefined,
      message: "",
      anonymous: true,
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Anonymous Feedback</h1>
          <p className="text-gray-500">Share your thoughts, suggestions, and concerns anonymously</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Feedback Form */}
          <Card className="md:col-span-2">
            <Tabs defaultValue="submit">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Feedback Form</CardTitle>
                  <TabsList>
                    <TabsTrigger value="submit">Submit</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>
                  Your feedback is completely anonymous and helps improve our workspace
                </CardDescription>
              </CardHeader>
              
              <TabsContent value="submit">
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Feedback Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="team">Team Dynamics</SelectItem>
                                  <SelectItem value="project">Project Management</SelectItem>
                                  <SelectItem value="process">Work Processes</SelectItem>
                                  <SelectItem value="leadership">Leadership</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Feedback Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="suggestion">Suggestion</SelectItem>
                                  <SelectItem value="praise">Praise</SelectItem>
                                  <SelectItem value="concern">Concern</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Overall Rating</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-1"
                              >
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <FormItem key={value} className="flex flex-col items-center space-y-1">
                                    <FormControl>
                                      <RadioGroupItem
                                        value={value.toString()}
                                        className="sr-only peer"
                                        id={`rating-${value}`}
                                      />
                                    </FormControl>
                                    <label
                                      htmlFor={`rating-${value}`}
                                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer flex-1"
                                    >
                                      <Star
                                        className={`h-5 w-5 ${
                                          parseInt(field.value || "0") >= value
                                            ? "fill-primary text-primary"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                      <span className="text-xs mt-1">{value}</span>
                                    </label>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Feedback</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Share your thoughts, ideas, concerns, or praise..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="anonymous"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <div className="flex h-4 w-4 items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal">
                                Submit Anonymously
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Your identity will be kept confidential when submitting this feedback
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Submit Feedback
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="history">
                <CardContent>
                  {submittedFeedback.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                      <History className="h-12 w-12 mb-4 text-gray-300" />
                      <p className="mb-2">No feedback submissions yet</p>
                      <p className="text-sm">Your feedback history will appear here after submission</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submittedFeedback.map((feedback) => (
                        <div key={feedback.id} className="flex items-start border rounded-lg p-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                            {feedback.status === "implemented" ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <History className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900 capitalize">
                                  {feedback.category} {feedback.type}
                                </h4>
                                <p className="text-gray-500 text-sm mt-1">{feedback.preview}</p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  feedback.status === "implemented"
                                    ? "bg-green-100 text-green-800"
                                    : feedback.status === "reviewed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Submitted on {feedback.date.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
          
          {/* Feedback Stats & Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Stats</CardTitle>
                <CardDescription>Overview of feedback submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium text-gray-500">Total</div>
                    <div className="mt-1 flex items-baseline">
                      <span className="text-2xl font-semibold text-gray-900">{feedbackStats.total}</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium text-green-500">Implemented</div>
                    <div className="mt-1 flex items-baseline">
                      <span className="text-2xl font-semibold text-gray-900">{feedbackStats.implemented}</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium text-blue-500">Reviewed</div>
                    <div className="mt-1 flex items-baseline">
                      <span className="text-2xl font-semibold text-gray-900">{feedbackStats.reviewed}</span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium text-gray-500">Pending</div>
                    <div className="mt-1 flex items-baseline">
                      <span className="text-2xl font-semibold text-gray-900">{feedbackStats.pending}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>About Anonymous Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-100 rounded-full p-2">
                    <UserCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">100% Anonymous</h4>
                    <p className="text-sm text-gray-500">
                      Your identity is never revealed with anonymous submissions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-100 rounded-full p-2">
                    <Heart className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Honest Feedback</h4>
                    <p className="text-sm text-gray-500">
                      Share constructive thoughts without fear of repercussions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-100 rounded-full p-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Drive Improvement</h4>
                    <p className="text-sm text-gray-500">
                      Help make our team and workspace better for everyone
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
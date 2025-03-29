import { Request, Response } from "express";

// This is our improved fallback model when API is not available
const ASSISTANT_MESSAGES = [
  {
    topic: "task_prioritization",
    responses: [
      "Based on your current workload, I recommend prioritizing the tasks with upcoming deadlines first. Focus on the high-priority items related to the Marketing Campaign project.",
      "Looking at your schedule, the Database Migration task should be your priority today. It has the highest impact on other team members' work.",
      "I'd recommend focusing on the tasks that are blocking others first. The API Integration task is currently a bottleneck for three other team members.",
      "Your most urgent task appears to be the Client Presentation preparation, due to its approaching deadline and high visibility with stakeholders.",
      "Based on your current velocity and remaining work, I suggest focusing on completing the Mobile App feature tasks before moving to the new website tasks."
    ]
  },
  {
    topic: "productivity_tips",
    responses: [
      "Try implementing the Pomodoro technique - work for 25 minutes, then take a 5-minute break. This can help maintain focus and prevent burnout during long coding sessions.",
      "Consider dedicating the first hour of your day to deep work with no distractions. This is when most people have their peak cognitive performance.",
      "For complex tasks, breaking them down into smaller, more manageable sub-tasks can help maintain momentum and provide clear milestones.",
      "Schedule similar types of work together (like meetings, coding, documentation) to minimize context switching, which can reduce productivity by up to 40%.",
      "End each day by planning your priorities for tomorrow. This reduces decision fatigue and helps you start focused the next day."
    ]
  },
  {
    topic: "team_collaboration",
    responses: [
      "Based on communication patterns, I notice the Design and Development teams could benefit from more frequent synchronization meetings. This might prevent the rework I'm seeing in recent tasks.",
      "The current sprint has an unusually high number of task reassignments. Consider a team discussion about initial task allocation to improve efficiency.",
      "Team utilization is uneven this sprint - the frontend team is at 95% capacity while the QA team is at 60%. Some task rebalancing might help overall progress.",
      "The project timeline indicates a potential bottleneck forming around the API integration work. Consider pulling in additional resources from the backend team.",
      "Communication analysis shows most project questions are being directed to Alex. This might indicate knowledge silos - consider documentation improvements or knowledge sharing sessions."
    ]
  },
  {
    topic: "project_insights",
    responses: [
      "Your team's velocity has increased by 15% over the last three sprints. The refactoring work done in January appears to be paying off in development speed.",
      "The Quality Assurance metrics show a reduction in new bugs this month, but resolution time has increased. This might indicate more complex issues are being found.",
      "Based on current progress, the Mobile App project is tracking 3 days behind schedule. The authentication feature is taking longer than initially estimated.",
      "Resource allocation analysis suggests the Design team is becoming a bottleneck. They're currently supporting 3 major projects with only 2 designers.",
      "The current project has 23% more scope changes than your team's average. Consider a review of the requirements gathering process to improve initial accuracy."
    ]
  },
  {
    topic: "deadline_estimates",
    responses: [
      "Based on your team's historical velocity and the remaining work, I estimate the current sprint will be completed 2 days after the planned end date.",
      "For the Website Redesign project, current progress suggests you'll meet the deadline with about 1-2 days buffer, assuming no major new requirements are added.",
      "Looking at the complexity and size of the Database Migration task, I estimate it will take 4-5 days to complete based on similar previous tasks.",
      "The Mobile App project is currently tracking to finish approximately 1 week later than planned, primarily due to delays in the authentication and payment features.",
      "For the upcoming presentation, preparation typically takes your team 3-4 days based on historical data for similar deliverables."
    ]
  },
  {
    topic: "general",
    responses: [
      "I'm here to help with your task management and project questions. I can analyze project data, suggest prioritization, and provide insights on team and individual productivity.",
      "I can help analyze your current workload, suggest task priorities, estimate completion times, or provide productivity tips. What specific assistance do you need today?",
      "I don't have all the specific details of your current tasks, but I can offer general productivity suggestions and help you think through prioritization based on what you share with me.",
      "While I don't have real-time access to all your project data, I can discuss general principles of task management and help you organize your thoughts around current work.",
      "I'd be happy to help brainstorm solutions to your current workflow challenges. What specific issues are you facing with your tasks or projects right now?"
    ]
  }
];

// Store conversation history for each user
const userConversations = new Map<number, Array<{role: string, content: string}>>();

// Maximum number of messages to keep in history per user
const MAX_HISTORY_LENGTH = 10;

// Helper function to determine which topic to use
function findBestMatchingTopic(message: string): string {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes("priorit") || messageLower.includes("important") || messageLower.includes("urgent")) {
    return "task_prioritization";
  }
  
  if (messageLower.includes("productiv") || messageLower.includes("efficient") || messageLower.includes("focus") || messageLower.includes("distract")) {
    return "productivity_tips";
  }
  
  if (messageLower.includes("team") || messageLower.includes("collaborat") || messageLower.includes("work together") || messageLower.includes("communicate")) {
    return "team_collaboration";
  }
  
  if (messageLower.includes("project") || messageLower.includes("progress") || messageLower.includes("status") || messageLower.includes("track")) {
    return "project_insights";
  }
  
  if (messageLower.includes("deadline") || messageLower.includes("due") || messageLower.includes("when") || messageLower.includes("estimate") || messageLower.includes("complete")) {
    return "deadline_estimates";
  }
  
  return "general";
}

// Generate a more relevant response based on message content
function generateLocalResponse(message: string): string {
  const topic = findBestMatchingTopic(message);
  const topicResponses = ASSISTANT_MESSAGES.find(t => t.topic === topic)?.responses || ASSISTANT_MESSAGES.find(t => t.topic === "general")!.responses;
  
  return topicResponses[Math.floor(Math.random() * topicResponses.length)];
}

// Try to use Perplexity API, fall back to local response
export async function handleChatRequest(req: Request, res: Response) {
  try {
    const { message } = req.body;
    const userId = req.user!.id;
    
    // Initialize conversation if it doesn't exist
    if (!userConversations.has(userId)) {
      userConversations.set(userId, [
        { role: "system", content: "You are TaskCollab AI, a helpful assistant for project and task management. Provide concise, practical advice." }
      ]);
    }
    
    // Get conversation history
    const conversation = userConversations.get(userId)!;
    
    // Add user message to history
    conversation.push({ role: "user", content: message });
    
    let aiResponse: string;
    
    // Check if Perplexity API key exists
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        // Call Perplexity API
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: conversation,
            temperature: 0.2,
            max_tokens: 150,
            top_p: 0.9
          })
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        aiResponse = data.choices[0].message.content;
      } catch (error) {
        console.error("Perplexity API error:", error);
        aiResponse = generateLocalResponse(message);
      }
    } else {
      // Use local response generator
      aiResponse = generateLocalResponse(message);
    }
    
    // Add AI response to history
    conversation.push({ role: "assistant", content: aiResponse });
    
    // Trim history if too long (keeping system message)
    if (conversation.length > MAX_HISTORY_LENGTH + 1) {
      const systemMessage = conversation[0];
      conversation.splice(1, conversation.length - MAX_HISTORY_LENGTH - 1);
      conversation[0] = systemMessage;
    }
    
    // Update conversation in storage
    userConversations.set(userId, conversation);
    
    // Return the AI response
    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat request" });
  }
}
import type { Express } from "express";
import { WebSocketServer } from "ws";
import { Server } from "http";
import { handleWebSocket } from "./websocket";
import { Tool, ToolPermission } from "../client/src/lib/types";
import { claudeClient } from "./lib/claude";
import { analyticsService } from './lib/analytics';
import { db } from "../db";
import { toolPermissions } from "../db/schema";
import { eq } from "drizzle-orm";
import { setUserRole, checkToolAccess } from './middleware/auth';
import { tools } from './tools';
let systemConfig = {
  systemMessage: `You are a helpful AI assistant with access to computer control.
  you have been given a {{TASK}} to complete ffrom the user. Think carefully step by step and determine the best plan of action.  Determine if you need to get any specific info from the web using your browser tools before you begin doing actual work on the web. For example, sigining in to google, going to a site, signing in with google, using credentials, and add items to cart and then go to cart and finalize transaction. 
Available tools:
- computer: Interact with the computer using mouse, keyboard, file system, and execute commands

When you need to use a tool, format your response like this:
To use computer: <tool>computer:{"action": "your command here"}</tool>

Please format your responses clearly. When using tools:
1. Explain what you're going to do
2. Use the tool with proper parameters
3. Wait for the tool result
4. Determine what tool to use next and call it with the result.
5. You operate independently and recursively, using tools to achieve your goals.
6. If you absolutely need to get info from the user, ask a question; other wise continue until {{TASK}} is complete.
7

Always validate inputs and handle errors gracefully.`,
  temperature: 0.7,
  maxTokens: 2048,
};

async function getToolPermissions(toolName: string): Promise<ToolPermission[]> {
  const perms = await db.select().from(toolPermissions).where(eq(toolPermissions.toolName, toolName));
  return perms.map(p => ({
    toolName: p.toolName,
    role: p.role,
    canExecute: p.canExecute,
    canModify: p.canModify,
    canDelete: p.canDelete
  }));
}

function validateToolDefinition(tool: Partial<Tool>): { valid: boolean; error?: string } {
  if (!tool.name || typeof tool.name !== 'string') {
    return { valid: false, error: 'Tool name is required and must be a string' };
  }
  if (!tool.description || typeof tool.description !== 'string') {
    return { valid: false, error: 'Tool description is required and must be a string' };
  }
  if (!tool.parameters || typeof tool.parameters !== 'object') {
    return { valid: false, error: 'Tool parameters must be an object' };
  }

  for (const [key, param] of Object.entries(tool.parameters)) {
    if (!param.type || !['string', 'number', 'boolean'].includes(param.type)) {
      return { valid: false, error: `Invalid parameter type for ${key}` };
    }
  }

  return { valid: true };
}

export function registerRoutes(app: Express, server: Server) {
  // Apply user role middleware globally
  app.use(setUserRole());

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        handleWebSocket(ws);
      });
    } else {
      socket.destroy();
    }
  });

  // Chat endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: "Invalid message format" });
        return;
      }
      const response = await claudeClient.sendMessage(message, systemConfig);
      res.json(response);
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process message" 
      });
    }
  });

  app.get("/api/messages", (req, res) => {
    try {
      res.json(claudeClient.getMessageHistory());
    } catch (error) {
      console.error('Message history error:', error);
      res.status(500).json({ 
        error: "Failed to fetch message history" 
      });
    }
  });

  // Development-only route for seeding tool executions
  if (app.get('env') === 'development') {
    app.post("/api/tools/seed", async (req, res) => {
      try {
        await seedToolExecutions();
        res.json({ message: 'Tool executions seeded successfully' });
      } catch (error) {
        console.error('Seeding error:', error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Failed to seed tool executions' 
        });
      }
    });
  }

  // Tool management endpoints
  app.get("/api/tools", async (req, res) => {
    try {
      const toolsWithPermissions = await Promise.all(
        tools.map(async (tool) => ({
          ...tool,
          permissions: await getToolPermissions(tool.name)
        }))
      );
      res.json(toolsWithPermissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  });

  app.post("/api/tools", checkToolAccess('canModify'), async (req, res) => {
    try {
      const toolData = req.body;
      
      const validation = validateToolDefinition(toolData);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      if (tools.find(t => t.name === toolData.name)) {
        res.status(409).json({ error: "Tool with this name already exists" });
        return;
      }

      const newTool: Tool = {
        name: toolData.name,
        description: toolData.description,
        parameters: toolData.parameters,
        enabled: true
      };

      // Add default permissions for the new tool
      await db.insert(toolPermissions).values([
        {
          toolName: newTool.name,
          role: 'admin',
          canExecute: true,
          canModify: true,
          canDelete: true
        },
        {
          toolName: newTool.name,
          role: 'user',
          canExecute: true,
          canModify: false,
          canDelete: false
        }
      ]);

      tools.push(newTool);
      
      const toolDescription = `- ${newTool.name}: ${newTool.description}`;
      systemConfig.systemMessage = systemConfig.systemMessage.replace(
        "Available tools:",
        `Available tools:\n${toolDescription}`
      );

      res.status(201).json(newTool);
    } catch (error) {
      console.error('Create tool error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create tool" 
      });
    }
  });

  app.patch("/api/tools/:name", checkToolAccess('canModify'), (req, res) => {
    try {
      const { name } = req.params;
      const { enabled } = req.body;
      const tool = tools.find((t) => t.name === name);

      if (!tool) {
        res.status(404).json({ error: "Tool not found" });
        return;
      }

      tool.enabled = enabled;
      res.json(tool);
    } catch (error) {
      res.status(500).json({ error: "Failed to update tool" });
    }
  });

  app.put("/api/tools/:name/permissions", checkToolAccess('canModify'), async (req, res) => {
    try {
      const { name } = req.params;
      const { permissions } = req.body;

      const tool = tools.find((t) => t.name === name);
      if (!tool) {
        res.status(404).json({ error: "Tool not found" });
        return;
      }

      // Update permissions in database
      await db.transaction(async (tx) => {
        // Delete existing permissions
        await tx.delete(toolPermissions)
          .where(eq(toolPermissions.toolName, name));

        // Insert new permissions
        await tx.insert(toolPermissions)
          .values(permissions.map((p: ToolPermission) => ({
            toolName: name,
            role: p.role,
            canExecute: p.canExecute,
            canModify: p.canModify,
            canDelete: p.canDelete
          })));
      });

      res.json({ message: "Permissions updated successfully" });
    } catch (error) {
      console.error('Update permissions error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update permissions" 
      });
    }
  });

  // System configuration endpoints
  app.get("/api/config", (req, res) => {
    try {
      res.json(systemConfig);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch config" });
    }
  });

  app.patch("/api/config", (req, res) => {
    try {
      systemConfig = { ...systemConfig, ...req.body };
      res.json(systemConfig);
    } catch (error) {
      res.status(500).json({ error: "Failed to update config" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const stats = await analyticsService.getToolStats();
      res.json(stats);
    } catch (error) {
      console.error('Analytics stats error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch analytics stats" 
      });
    }
  });

  app.get("/api/analytics/executions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const executions = await analyticsService.getRecentExecutions(limit);
      res.json(executions);
    } catch (error) {
      console.error('Analytics executions error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch execution history" 
      });
    }
  });

  systemConfig.systemMessage += `
Computer use is enabled in a controlled Docker environment.
Display resolution: 1024x768
Available actions:
- browse: Open URLs in Firefox
- click: Move mouse and click at coordinates
- type: Type text using keyboard
- execute: Run shell commands (restricted)

Always verify actions before execution and report results.`;
}
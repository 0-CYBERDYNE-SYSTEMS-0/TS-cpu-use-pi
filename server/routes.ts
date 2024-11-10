import type { Express } from "express";
import { WebSocketServer } from "ws";
import { Server } from "http";
import { handleWebSocket } from "./websocket";
import { Tool } from "../client/src/lib/types";
import { fileSystemTool } from "./tools/fileSystem";
import { systemControlTool } from "./tools/systemControl";
import { claudeClient } from "./lib/claude";

const tools: Tool[] = [fileSystemTool, systemControlTool];
let systemConfig = {
  systemMessage: `You are a helpful AI assistant with access to various system tools.
Available tools:
- fileSystem: Perform file system operations (read, write, list, delete files)
- systemControl: Execute system commands (ps, df, free, uptime)

When you need to use a tool, format your response like this:
To use fileSystem: <tool>fileSystem:{"operation": "read", "path": "/example.txt"}</tool>
To use systemControl: <tool>systemControl:{"command": "ps"}</tool>

Please format your responses clearly. When using tools:
1. Explain what you're going to do
2. Use the tool with proper parameters
3. Wait for the tool result
4. Explain the result to the user

Always validate inputs and handle errors gracefully.`,
  temperature: 0.7,
  maxTokens: 2048,
};

export function registerRoutes(app: Express, server: Server) {
  // Initialize WebSocket server with noServer option
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade requests
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

  // Tool management endpoints
  app.get("/api/tools", (req, res) => {
    try {
      res.json(tools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  });

  app.patch("/api/tools/:name", (req, res) => {
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
}

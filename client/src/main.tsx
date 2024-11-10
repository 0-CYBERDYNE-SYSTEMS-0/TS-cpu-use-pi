import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route, Link } from "wouter";
import "./index.css";
import { SWRConfig } from "swr";
import { fetcher } from "./lib/fetcher";
import { Toaster } from "@/components/ui/toaster";
import { ChatPage } from "./pages/ChatPage";
import { ToolsPage } from "./pages/ToolsPage";
import { ConfigPage } from "./pages/ConfigPage";
import { wsClient } from "./lib/websocket";

// Initialize WebSocket connection
wsClient.connect();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SWRConfig value={{ fetcher }}>
      <div className="min-h-screen bg-background">
        <nav className="border-b px-4">
          <div className="flex h-14 items-center space-x-4">
            <Link href="/">
              <a className="text-sm font-medium">Chat</a>
            </Link>
            <Link href="/tools">
              <a className="text-sm font-medium">Tools</a>
            </Link>
            <Link href="/config">
              <a className="text-sm font-medium">Config</a>
            </Link>
          </div>
        </nav>
        
        <Switch>
          <Route path="/" component={ChatPage} />
          <Route path="/tools" component={ToolsPage} />
          <Route path="/config" component={ConfigPage} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </div>
      <Toaster />
    </SWRConfig>
  </StrictMode>
);

import { Message, Tool, SystemConfig, ToolStats, ToolExecution } from './types';

const API_BASE = '/api';

export async function sendMessage(message: string) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  return response.json();
}

export async function getTools(): Promise<Tool[]> {
  const response = await fetch(`${API_BASE}/tools`);
  return response.json();
}

export async function updateTool(name: string, enabled: boolean) {
  const response = await fetch(`${API_BASE}/tools/${name}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  return response.json();
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const response = await fetch(`${API_BASE}/config`);
  return response.json();
}

export async function updateSystemConfig(config: Partial<SystemConfig>) {
  const response = await fetch(`${API_BASE}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return response.json();
}

export async function getMessageHistory(): Promise<Message[]> {
  const response = await fetch(`${API_BASE}/messages`);
  return response.json();
}

export async function getToolStats(): Promise<ToolStats[]> {
  const response = await fetch(`${API_BASE}/analytics/stats`);
  return response.json();
}

export async function getToolExecutions(): Promise<ToolExecution[]> {
  const response = await fetch(`${API_BASE}/analytics/executions`);
  return response.json();
}
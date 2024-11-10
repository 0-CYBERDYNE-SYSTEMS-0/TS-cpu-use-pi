import { pgTable, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const toolExecutions = pgTable("tool_executions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  toolName: text("tool_name").notNull(),
  parameters: jsonb("parameters").notNull(),
  status: text("status").notNull(), // 'success', 'error', 'pending'
  result: jsonb("result"),
  error: text("error"),
  executionTimeMs: integer("execution_time_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const toolStats = pgTable("tool_stats", {
  toolName: text("tool_name").primaryKey(),
  totalExecutions: integer("total_executions").default(0).notNull(),
  successfulExecutions: integer("successful_executions").default(0).notNull(),
  failedExecutions: integer("failed_executions").default(0).notNull(),
  avgExecutionTimeMs: integer("avg_execution_time_ms"),
  lastExecutedAt: timestamp("last_executed_at"),
  enabled: boolean("enabled").default(true).notNull(),
});

export const toolPermissions = pgTable("tool_permissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  toolName: text("tool_name").notNull(),
  role: text("role").notNull(), // 'admin', 'user', etc.
  canExecute: boolean("can_execute").default(false).notNull(),
  canModify: boolean("can_modify").default(false).notNull(),
  canDelete: boolean("can_delete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema types
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertToolExecutionSchema = createInsertSchema(toolExecutions);
export const selectToolExecutionSchema = createSelectSchema(toolExecutions);
export const insertToolStatsSchema = createInsertSchema(toolStats);
export const selectToolStatsSchema = createSelectSchema(toolStats);
export const insertToolPermissionSchema = createInsertSchema(toolPermissions);
export const selectToolPermissionSchema = createSelectSchema(toolPermissions);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type InsertToolExecution = z.infer<typeof insertToolExecutionSchema>;
export type ToolExecution = z.infer<typeof selectToolExecutionSchema>;
export type InsertToolStats = z.infer<typeof insertToolStatsSchema>;
export type ToolStats = z.infer<typeof selectToolStatsSchema>;
export type InsertToolPermission = z.infer<typeof insertToolPermissionSchema>;
export type ToolPermission = z.infer<typeof selectToolPermissionSchema>;

import { db } from "../../db";
import { toolExecutions, toolStats } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { Tool, ToolCall } from "../../client/src/lib/types";

export class AnalyticsService {
  async trackToolExecution(toolCall: ToolCall, startTime: number) {
    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;

    // Record the execution
    await db.insert(toolExecutions).values({
      toolName: toolCall.name,
      parameters: toolCall.args,
      status: toolCall.status,
      result: toolCall.result || null,
      error: toolCall.status === 'error' ? String(toolCall.result) : null,
      executionTimeMs,
    });

    // Update stats
    const existingStats = await db
      .select()
      .from(toolStats)
      .where(eq(toolStats.toolName, toolCall.name))
      .limit(1);

    if (existingStats.length === 0) {
      // Create new stats record
      await db.insert(toolStats).values({
        toolName: toolCall.name,
        totalExecutions: 1,
        successfulExecutions: toolCall.status === 'success' ? 1 : 0,
        failedExecutions: toolCall.status === 'error' ? 1 : 0,
        avgExecutionTimeMs: executionTimeMs,
        lastExecutedAt: new Date(),
      });
    } else {
      // Update existing stats
      const stats = existingStats[0];
      const newTotal = stats.totalExecutions + 1;
      const newSuccessful = stats.successfulExecutions + (toolCall.status === 'success' ? 1 : 0);
      const newFailed = stats.failedExecutions + (toolCall.status === 'error' ? 1 : 0);
      
      // Calculate new average execution time
      const currentTotalTime = stats.avgExecutionTimeMs * stats.totalExecutions;
      const newAvgTime = Math.round((currentTotalTime + executionTimeMs) / newTotal);

      await db
        .update(toolStats)
        .set({
          totalExecutions: newTotal,
          successfulExecutions: newSuccessful,
          failedExecutions: newFailed,
          avgExecutionTimeMs: newAvgTime,
          lastExecutedAt: new Date(),
        })
        .where(eq(toolStats.toolName, toolCall.name));
    }
  }

  async getToolStats() {
    return db.select().from(toolStats);
  }

  async getRecentExecutions(limit = 100) {
    return db
      .select()
      .from(toolExecutions)
      .orderBy(toolExecutions.createdAt)
      .limit(limit);
  }
}

export const analyticsService = new AnalyticsService();

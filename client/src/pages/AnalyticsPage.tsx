import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import useSWR from "swr";
import { getToolStats, getToolExecutions } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function AnalyticsPage() {
  const { 
    data: stats = [], 
    error: statsError,
    isLoading: statsLoading 
  } = useSWR('/api/analytics/stats', getToolStats);

  const { 
    data: executions = [], 
    error: executionsError,
    isLoading: executionsLoading 
  } = useSWR('/api/analytics/executions', getToolExecutions);

  if (statsLoading || executionsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (statsError || executionsError) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load analytics data
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Tool Analytics</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.toolName} className="p-4">
            <h3 className="font-semibold mb-2">{stat.toolName}</h3>
            <div className="space-y-1 text-sm">
              <p>Total Executions: {stat.totalExecutions}</p>
              <p>Success Rate: {((stat.successfulExecutions / stat.totalExecutions) * 100).toFixed(1)}%</p>
              <p>Avg. Execution Time: {stat.avgExecutionTimeMs}ms</p>
              <p>Last Used: {new Date(stat.lastExecutedAt).toLocaleString()}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Execution Distribution</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <XAxis dataKey="toolName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="successfulExecutions" name="Successful" fill="#22c55e" />
              <Bar dataKey="failedExecutions" name="Failed" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
        <div className="space-y-2">
          {executions.map((execution) => (
            <div 
              key={execution.id}
              className="p-2 border rounded flex items-center gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${
                execution.status === 'success' ? 'bg-green-500' :
                execution.status === 'error' ? 'bg-red-500' :
                'bg-yellow-500'
              }`} />
              <div className="flex-1">
                <p className="font-medium">{execution.toolName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(execution.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {execution.executionTimeMs}ms
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

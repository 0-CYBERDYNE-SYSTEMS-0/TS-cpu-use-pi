import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import useSWR from "swr";
import { getToolStats, getToolExecutions } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export function AnalyticsPage() {
  const { 
    data: stats = [], 
    error: statsError,
    isLoading: statsLoading 
  } = useSWR('/api/analytics/stats', getToolStats, {
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  const { 
    data: executions = [], 
    error: executionsError,
    isLoading: executionsLoading 
  } = useSWR('/api/analytics/executions', getToolExecutions, {
    refreshInterval: 30000
  });

  if (statsLoading || executionsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (statsError || executionsError) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertDescription>
            {statsError?.message || executionsError?.message || 'Failed to load analytics data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Tool Analytics</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.toolName} className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {stat.toolName}
              {stat.enabled && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  Active
                </span>
              )}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Executions:</span>
                <span className="font-medium">{stat.totalExecutions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate:</span>
                <span className={`font-medium ${
                  (stat.successfulExecutions / stat.totalExecutions) * 100 >= 90
                    ? 'text-green-600'
                    : (stat.successfulExecutions / stat.totalExecutions) * 100 >= 70
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {stat.totalExecutions ? ((stat.successfulExecutions / stat.totalExecutions) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Execution Time:</span>
                <span className="font-medium">{formatDuration(stat.avgExecutionTimeMs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Used:</span>
                <span className="font-medium">
                  {stat.lastExecutedAt 
                    ? formatDistanceToNow(new Date(stat.lastExecutedAt), { addSuffix: true })
                    : 'Never'}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Execution Distribution</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="toolName" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'successfulExecutions' ? 'Successful' : 'Failed']}
              />
              <Bar dataKey="successfulExecutions" name="Successful" fill="#22c55e" stackId="a" />
              <Bar dataKey="failedExecutions" name="Failed" fill="#ef4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {executions.map((execution) => (
            <div 
              key={execution.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    execution.status === 'success' ? 'bg-green-500' :
                    execution.status === 'error' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="font-medium">{execution.toolName}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDuration(execution.executionTimeMs)}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-sm text-muted-foreground">
                  Parameters: {JSON.stringify(execution.parameters)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(execution.createdAt), { addSuffix: true })}
                </div>
              </div>
              {execution.error && (
                <div className="mt-1 text-sm text-red-600">
                  Error: {execution.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

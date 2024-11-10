import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import useSWR from "swr";
import { getToolStats, getToolExecutions } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Activity,
  Timer
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <div className="container py-6">
        <Card className="p-8">
          <div className="space-y-4">
            <div className="h-[300px] w-full animate-pulse bg-muted rounded-lg" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse bg-muted rounded" />
              ))}
            </div>
          </div>
        </Card>
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

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2 mb-8">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Tool Analytics</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const successRate = stat.totalExecutions 
            ? (stat.successfulExecutions / stat.totalExecutions) * 100 
            : 0;

          return (
            <Card key={stat.toolName} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    {stat.toolName}
                    {stat.enabled && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </h3>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      Total Executions
                    </div>
                    <p className="text-lg font-semibold">{stat.totalExecutions}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      Avg. Time
                    </div>
                    <p className="text-lg font-semibold">
                      {formatDuration(stat.avgExecutionTimeMs)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className={`text-sm font-medium ${getSuccessRateColor(successRate)}`}>
                      {successRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all" 
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last used: {stat.lastExecutedAt 
                    ? formatDistanceToNow(new Date(stat.lastExecutedAt), { addSuffix: true })
                    : 'Never'}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Execution Distribution</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="toolName" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  value,
                  name === 'successfulExecutions' ? 'Successful' : 'Failed'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="successfulExecutions" 
                name="Successful" 
                fill="hsl(var(--success))"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="failedExecutions" 
                name="Failed" 
                fill="hsl(var(--destructive))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Recent Executions</h2>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {executions.map((execution, index) => (
            <div 
              key={execution.id}
              className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                index % 2 === 0 ? 'bg-muted/20' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {execution.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : execution.status === 'error' ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-warning animate-spin" />
                  )}
                  <span className="font-medium">{execution.toolName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    {formatDuration(execution.executionTimeMs)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(execution.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="text-sm text-muted-foreground truncate">
                      Parameters: {JSON.stringify(execution.parameters)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <pre className="text-xs">
                      {JSON.stringify(execution.parameters, null, 2)}
                    </pre>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>

              {execution.error && (
                <div className="mt-2 p-2 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20">
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

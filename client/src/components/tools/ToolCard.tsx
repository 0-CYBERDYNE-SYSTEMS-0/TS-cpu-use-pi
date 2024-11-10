import { Tool } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { updateTool } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { mutate } from 'swr';
import { ToolPermissions } from './ToolPermissions';

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const { toast } = useToast();

  async function handleToggle() {
    try {
      await updateTool(tool.name, !tool.enabled);
      mutate('/api/tools');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tool status',
        variant: 'destructive'
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{tool.name}</CardTitle>
          <div className="flex items-center gap-2">
            <ToolPermissions tool={tool} />
            <Switch
              checked={tool.enabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>
        <CardDescription>{tool.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Parameters:</h4>
          <pre className="text-xs bg-muted p-2 rounded">
            {JSON.stringify(tool.parameters, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

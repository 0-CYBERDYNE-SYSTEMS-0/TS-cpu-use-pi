import { Tool } from '@/lib/types';
import { ToolCard } from './ToolCard';
import useSWR from 'swr';
import { getTools } from '@/lib/api';

export function ToolRegistry() {
  const { data: tools = [] } = useSWR<Tool[]>('/api/tools', getTools);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.name} tool={tool} />
      ))}
    </div>
  );
}

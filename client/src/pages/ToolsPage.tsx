import { ToolRegistry } from '@/components/tools/ToolRegistry';

export function ToolsPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Tool Management</h1>
      <ToolRegistry />
    </div>
  );
}

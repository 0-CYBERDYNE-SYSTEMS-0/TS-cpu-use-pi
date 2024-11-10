import { SystemConfig } from '@/components/config/SystemConfig';

export function ConfigPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">System Configuration</h1>
      <SystemConfig />
    </div>
  );
}

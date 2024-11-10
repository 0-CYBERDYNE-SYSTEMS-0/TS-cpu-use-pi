import { Tool } from '@/lib/types';
import { ToolCard } from './ToolCard';
import { CreateToolForm } from './CreateToolForm';
import useSWR from 'swr';
import { getTools } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from 'react';

export function ToolRegistry() {
  const { data: tools = [] } = useSWR<Tool[]>('/api/tools', getTools);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Custom Tool
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Create Custom Tool</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <CreateToolForm onSuccess={() => setIsOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>
    </div>
  );
}

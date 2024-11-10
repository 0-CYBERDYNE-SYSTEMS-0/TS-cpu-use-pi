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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ToolRegistry() {
  const { data: tools = [] } = useSWR<Tool[]>('/api/tools', getTools);
  const [isOpen, setIsOpen] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      setIsOpen(open);
    }
  };

  const handleCloseConfirm = () => {
    setShowUnsavedDialog(false);
    setIsOpen(false);
    setHasUnsavedChanges(false);
  };

  const handleCloseDismiss = () => {
    setShowUnsavedDialog(false);
  };

  return (
    <div className="space-y-6">
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Custom Tool
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-[400px] sm:w-[540px]"
        >
          <SheetHeader>
            <SheetTitle>Create Custom Tool</SheetTitle>
            <SheetDescription>
              Create a new custom tool by defining its parameters and behavior.
              Tools can be used by the AI assistant to perform specific actions.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <CreateToolForm 
              onSuccess={() => {
                setIsOpen(false);
                setHasUnsavedChanges(false);
              }}
              onFormChange={setHasUnsavedChanges}
              existingTools={tools}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close the form?
              Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDismiss}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseConfirm}>
              Close Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, Loader2 } from 'lucide-react';
import { Tool, ToolPermission } from '@/lib/types';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateToolPermissions } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { mutate } from 'swr';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ToolPermissionsProps {
  tool: Tool;
}

const DEFAULT_ROLES = ['admin', 'user'];

const ROLE_DESCRIPTIONS = {
  admin: 'Full access to manage and control the tool',
  user: 'Basic access to use the tool with limited permissions'
};

export function ToolPermissions({ tool }: ToolPermissionsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<ToolPermission[]>(
    tool.permissions || DEFAULT_ROLES.map(role => ({
      toolName: tool.name,
      role,
      canExecute: role === 'admin',
      canModify: role === 'admin',
      canDelete: role === 'admin'
    }))
  );

  const handlePermissionChange = (
    role: string,
    field: keyof Omit<ToolPermission, 'toolName' | 'role'>,
    value: boolean
  ) => {
    setError(null);
    setPermissions(prev =>
      prev.map(p =>
        p.role === role
          ? { ...p, [field]: value }
          : p
      )
    );
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await updateToolPermissions(tool.name, permissions);
      toast({
        title: 'Success',
        description: 'Tool permissions updated successfully'
      });
      mutate('/api/tools');
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update permissions';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          aria-label="Manage tool permissions"
        >
          <Settings className="h-4 w-4" />
          <span>Permissions</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tool Permissions - {tool.name}</SheetTitle>
          <SheetDescription>
            Manage access permissions for different user roles.
            Configure who can execute, modify, or delete this tool.
          </SheetDescription>
        </SheetHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 space-y-6">
          {permissions.map(({ role, canExecute, canModify, canDelete }) => (
            <div key={role} className="space-y-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-medium capitalize cursor-help">
                      {role} Role
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="ml-4 space-y-3">
                <TooltipProvider>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${role}-execute`}
                      checked={canExecute}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(role, 'canExecute', checked as boolean)
                      }
                      aria-label={`Allow ${role} to execute tool`}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label 
                          htmlFor={`${role}-execute`}
                          className="cursor-help"
                        >
                          Can Execute
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Allow this role to run and use the tool</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${role}-modify`}
                      checked={canModify}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(role, 'canModify', checked as boolean)
                      }
                      aria-label={`Allow ${role} to modify tool settings`}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label 
                          htmlFor={`${role}-modify`}
                          className="cursor-help"
                        >
                          Can Modify
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Allow this role to modify tool settings and parameters</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${role}-delete`}
                      checked={canDelete}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(role, 'canDelete', checked as boolean)
                      }
                      aria-label={`Allow ${role} to delete tool`}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label 
                          htmlFor={`${role}-delete`}
                          className="cursor-help"
                        >
                          Can Delete
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Allow this role to remove the tool from the system</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>

        <SheetFooter className="mt-6">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Permissions'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

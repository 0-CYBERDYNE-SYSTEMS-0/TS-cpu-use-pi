import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Loader2, AlertTriangle } from 'lucide-react';
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

  // Validate permissions on change
  const validatePermissions = (perms: ToolPermission[]): string | null => {
    // Check if at least one role has execution permission
    const hasExecutePermission = perms.some(p => p.canExecute);
    if (!hasExecutePermission) {
      return 'At least one role must have execution permission';
    }

    // Ensure admin role has all permissions
    const adminPerms = perms.find(p => p.role === 'admin');
    if (!adminPerms?.canExecute || !adminPerms?.canModify || !adminPerms?.canDelete) {
      return 'Admin role must maintain full permissions';
    }

    return null;
  };

  const handlePermissionChange = (
    role: string,
    field: keyof Omit<ToolPermission, 'toolName' | 'role'>,
    value: boolean
  ) => {
    setError(null);
    const updatedPermissions = permissions.map(p =>
      p.role === role ? { ...p, [field]: value } : p
    );

    // Validate the changes
    const validationError = validatePermissions(updatedPermissions);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPermissions(updatedPermissions);
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    // Final validation before saving
    const validationError = validatePermissions(permissions);
    if (validationError) {
      setError(validationError);
      setIsSaving(false);
      return;
    }

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

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setPermissions(
        tool.permissions || DEFAULT_ROLES.map(role => ({
          toolName: tool.name,
          role,
          canExecute: role === 'admin',
          canModify: role === 'admin',
          canDelete: role === 'admin'
        }))
      );
      setError(null);
    }
  }, [isOpen, tool]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          aria-label="Manage tool permissions"
        >
          <Settings className="h-4 w-4" />
          <span>Permissions</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tool Permissions - {tool.name}</DialogTitle>
          <DialogDescription>
            Manage access permissions for different user roles.
            Configure who can execute, modify, or delete this tool.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
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
                      disabled={role === 'admin'} // Admin must maintain execute permission
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
                      disabled={role === 'admin'} // Admin must maintain modify permission
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
                      disabled={role === 'admin'} // Admin must maintain delete permission
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

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !!error}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

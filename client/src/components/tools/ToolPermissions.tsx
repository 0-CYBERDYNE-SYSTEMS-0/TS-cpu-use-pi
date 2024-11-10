import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import { Tool, ToolPermission } from '@/lib/types';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateToolPermissions } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { mutate } from 'swr';

interface ToolPermissionsProps {
  tool: Tool;
}

const DEFAULT_ROLES = ['admin', 'user'];

export function ToolPermissions({ tool }: ToolPermissionsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
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
    setPermissions(prev =>
      prev.map(p =>
        p.role === role
          ? { ...p, [field]: value }
          : p
      )
    );
  };

  const handleSave = async () => {
    try {
      await updateToolPermissions(tool.name, permissions);
      toast({
        title: 'Success',
        description: 'Tool permissions updated successfully'
      });
      mutate('/api/tools');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update permissions',
        variant: 'destructive'
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tool Permissions - {tool.name}</SheetTitle>
          <SheetDescription>
            Manage access permissions for different user roles.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {permissions.map(({ role, canExecute, canModify, canDelete }) => (
            <div key={role} className="space-y-4">
              <h3 className="font-medium capitalize">{role}</h3>
              <div className="ml-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${role}-execute`}
                    checked={canExecute}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(role, 'canExecute', checked as boolean)
                    }
                  />
                  <Label htmlFor={`${role}-execute`}>Can Execute</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${role}-modify`}
                    checked={canModify}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(role, 'canModify', checked as boolean)
                    }
                  />
                  <Label htmlFor={`${role}-modify`}>Can Modify</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${role}-delete`}
                    checked={canDelete}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(role, 'canDelete', checked as boolean)
                    }
                  />
                  <Label htmlFor={`${role}-delete`}>Can Delete</Label>
                </div>
              </div>
            </div>
          ))}

          <Button onClick={handleSave} className="w-full">
            Save Permissions
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

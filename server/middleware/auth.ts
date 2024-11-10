import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { toolPermissions } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

// Extend Express Request type to include user role
declare global {
  namespace Express {
    interface Request {
      userRole?: string;
    }
  }
}

export async function checkToolPermission(
  toolName: string,
  role: string,
  permissionType: 'canExecute' | 'canModify' | 'canDelete'
): Promise<boolean> {
  const permission = await db.query.toolPermissions.findFirst({
    where: and(
      eq(toolPermissions.toolName, toolName),
      eq(toolPermissions.role, role)
    ),
  });

  return permission ? permission[permissionType] : false;
}

// Middleware to set user role
export function setUserRole(defaultRole: string = 'user') {
  return (req: Request, _res: Response, next: NextFunction) => {
    // In a real application, this would come from authentication
    // For now, we'll use a default role
    req.userRole = defaultRole;
    next();
  };
}

// Middleware to check tool permissions
export function checkToolAccess(permissionType: 'canExecute' | 'canModify' | 'canDelete') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { toolName } = req.params;
    const userRole = req.userRole || 'user';

    try {
      const hasPermission = await checkToolPermission(toolName, userRole, permissionType);
      
      if (!hasPermission) {
        return res.status(403).json({
          error: `Unauthorized: You don't have permission to ${permissionType.replace('can', '').toLowerCase()} this tool`
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        error: 'Failed to verify permissions'
      });
    }
  };
}

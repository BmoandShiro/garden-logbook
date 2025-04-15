import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: Role;
    }
  }
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role?: Role;
  }
}

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MODERATOR = 'MODERATOR'
}

export enum Permission {
  CREATE_PLANT = 'CREATE_PLANT',
  EDIT_PLANT = 'EDIT_PLANT',
  DELETE_PLANT = 'DELETE_PLANT',
  CREATE_LOG = 'CREATE_LOG',
  EDIT_LOG = 'EDIT_LOG',
  DELETE_LOG = 'DELETE_LOG',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_STRAINS = 'MANAGE_STRAINS'
}

// Default permissions for each role
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission), // Admins have all permissions
  [Role.MODERATOR]: [
    Permission.CREATE_PLANT,
    Permission.EDIT_PLANT,
    Permission.CREATE_LOG,
    Permission.EDIT_LOG,
    Permission.MANAGE_STRAINS,
  ],
  [Role.USER]: [
    Permission.CREATE_PLANT,
    Permission.EDIT_PLANT,
    Permission.CREATE_LOG,
    Permission.EDIT_LOG,
  ],
};

export interface User {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
  permissions: Permission[];
}

export function hasPermission(user: User, permission: Permission): boolean {
  // Admins always have all permissions
  if (user.role === Role.ADMIN) return true;
  
  // Check if the user has the specific permission
  return user.permissions.includes(permission);
}

export function hasRole(user: User, role: Role): boolean {
  return user.role === role;
}

export function canManageUser(actor: User, target: User): boolean {
  // Admins can manage anyone
  if (actor.role === Role.ADMIN) return true;
  
  // Moderators can manage regular users
  if (actor.role === Role.MODERATOR && target.role === Role.USER) return true;
  
  // Users can't manage anyone
  return false;
} 
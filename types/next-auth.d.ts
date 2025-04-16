import { DefaultSession } from "next-auth"
import { Role, Permission } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      permissions: Permission[];
    } & DefaultSession["user"]
  }

  interface User {
    role: Role;
    permissions: Permission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    permissions: Permission[];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role;
    permissions: Permission[];
  }
} 
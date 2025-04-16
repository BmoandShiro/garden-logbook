import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { db } from "../../../../lib/db";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import { AdapterUser } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.permissions = user.permissions;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      try {
        // Check if user exists
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        // If user doesn't exist, create them
        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: "USER",
              permissions: [],
            },
          });
          return true;
        }

        // If this is a different auth provider but same email
        if (account && existingUser.accounts.length === 0) {
          // Allow linking the account
          return true;
        }

        // If user exists and has accounts, check if this account is one of them
        const existingAccount = existingUser.accounts.find(
          (acc) => acc.provider === account?.provider
        );

        // Allow sign in if account is already linked or if user has no linked accounts
        return !!existingAccount || existingUser.accounts.length === 0;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 
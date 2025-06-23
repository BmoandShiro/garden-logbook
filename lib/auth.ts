import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { createHash } from 'crypto';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function generateToken(length: number) {
  const characters = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function html(token: string, url: string) {
  return `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">Sign in to Garden Logbook</h2>
        <p>Click the button below to sign in instantly.</p>
        <a href="${url}" target="_blank" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In</a>
        <p style="margin-top: 20px;">Alternatively, you can use the following code:</p>
        <p style="font-size: 24px; font-weight: bold; color: #4CAF50; letter-spacing: 2px;">${token}</p>
        <p>This code will expire in 24 hours.</p>
        <hr/>
        <p style="font-size: 0.8em; color: #777;">If you did not request this email, you can safely ignore it.</p>
      </div>
    </body>
  `;
}

// Extend next-auth types
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    permissions: string[];
  }
  
  interface Session {
    user: User & {
      id: string;
      role: string;
      permissions: string[];
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        secure: true,
      },
      from: process.env.EMAIL_FROM,
      generateVerificationToken: async () => {
        // Use NextAuth's default for the magic link
        return undefined;
      },
      sendVerificationRequest: async ({ identifier: email, url, token }) => {
        // Generate a secure 6-digit code for manual entry
        const code = generateSixDigitCode();
        const hashedCode = createHash('sha256').update(code).digest('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Store the hashed code in EmailCodeVerification for our custom code entry
        await db.emailCodeVerification.create({
          data: {
            email,
            code: hashedCode,
            expires,
          },
        });
        
        // Store NextAuth's original token in VerificationToken for magic link compatibility
        // This is what NextAuth expects when the magic link is clicked
        await db.verificationToken.create({
          data: {
            identifier: email,
            token: token, // Use NextAuth's original token, not our hashed code
            expires,
          },
        });
        
        // Debug log for the code/token being sent in the email
        console.log('DEBUG: Sending email verification token:', token);
        console.log('DEBUG: Sending 6-digit code:', code);
        console.log('DEBUG: Hashed 6-digit code:', hashedCode);
        
        // Try Gmail SMTP first
        try {
          const transport = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
            secure: true,
          });
          await transport.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Sign in to Garden Logbook',
            html: html(code, url)
          });
          return;
        } catch (smtpError) {
          console.error("SMTP SEND ERROR, falling back to Resend (if configured):", smtpError);
        }
        // Fallback: Resend (if configured)
        if (resend) {
          try {
            await resend.emails.send({
              from: 'onboarding@resend.dev',
              to: email,
              subject: 'Sign in to Garden Logbook',
              html: html(code, url)
            });
          } catch (resendError) {
            console.error("Resend SEND ERROR:", resendError);
          }
        }
      },
    }),
    CredentialsProvider({
      id: "verified-email",
      name: "Verified Email",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          console.log('DEBUG: Missing credentials:', { email: credentials?.email, hasCode: !!credentials?.code });
          return null;
        }

        console.log('DEBUG: Credentials provider received:', { email: credentials.email, code: credentials.code });

        // Hash the code to match how it's stored
        const hashedCode = createHash('sha256').update(credentials.code).digest('hex');
        console.log('DEBUG: Hashed code in credentials provider:', hashedCode);
        
        // Check if the code is valid
        const verification = await db.emailCodeVerification.findFirst({
          where: {
            email: credentials.email,
            code: hashedCode,
            expires: { gte: new Date() },
          },
        });

        console.log('DEBUG: Found verification in credentials provider:', verification);

        if (!verification) {
          console.log('DEBUG: No verification found in credentials provider');
          return null;
        }

        // Find or create the user
        let user = await db.user.findUnique({ where: { email: credentials.email } });
        if (!user) {
          user = await db.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
              role: 'USER',
              permissions: [],
            },
          });
        }

        console.log('DEBUG: User found/created in credentials provider:', user);

        // Delete the verification code
        await db.emailCodeVerification.delete({ where: { id: verification.id } });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        };
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      try {
        // Check if user exists with this email
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        // If user doesn't exist, create them with available info
        if (!existingUser) {
          const newUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split('@')[0],
              image: user.image,
              role: "USER",
              permissions: [],
            },
          });

          if (account) {
            await db.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          }

          // Do NOT auto-accept or delete garden invites here. Invites will remain pending until the user accepts or declines them via the UI.

          return true;
        }

        // Update existing user's image if they're signing in with Google and don't have an image
        if (account?.provider === 'google' && !existingUser.image && user.image) {
          await db.user.update({
            where: { email: user.email },
            data: { image: user.image },
          });
        }

        // If using email provider, always allow
        if (!account || account.provider === 'email') {
          return true;
        }

        // If the account doesn't exist for this provider, create it
        if (!existingUser.accounts.some(acc => acc.provider === account?.provider)) {
          await db.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
}; 
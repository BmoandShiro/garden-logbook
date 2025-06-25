import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { signIn } from 'next-auth/react';

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const email = data.get('email') as string;
  const code = data.get('token') as string;

  console.log('DEBUG: Received email:', email);
  console.log('DEBUG: Received code:', code);

  if (!email || !code) {
    return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
  }

  // Hash the code to match how it's stored in the database
  const hashedCode = createHash('sha256').update(code).digest('hex');
  console.log('DEBUG: Hashed code:', hashedCode);

  // Find the code in the EmailCodeVerification table
  const verification = await db.emailCodeVerification.findFirst({
    where: {
      email,
      code: hashedCode,
      expires: { gte: new Date() },
    },
  });

  console.log('DEBUG: Found code verification:', verification);

  if (!verification) {
    // Print all codes for this email for debugging
    const allCodes = await db.emailCodeVerification.findMany({
      where: { email },
    });
    console.log('DEBUG: All codes for this email:', allCodes);
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
  }

  // Find or create the user
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: email.split('@')[0],
        role: 'USER',
        permissions: [],
      },
    });
  }

  // Don't delete the code here - let the credentials provider handle it
  // This ensures the code is still available when the credentials provider runs

  // Debug: Print all VerificationTokens for this email before redirect
  const allVerificationTokens = await db.verificationToken.findMany({
    where: { identifier: email },
  });
  console.log('DEBUG: All VerificationTokens for this email:', allVerificationTokens);

  // Find the NextAuth token that corresponds to this verification
  // We need to find a token that expires around the same time as our code verification
  const nextAuthToken = allVerificationTokens.find(vt => 
    Math.abs(new Date(vt.expires).getTime() - new Date(verification.expires).getTime()) < 1000 // Within 1 second
  );
  
  console.log('DEBUG: Found NextAuth token:', nextAuthToken);
  
  if (!nextAuthToken) {
    console.log('DEBUG: No matching NextAuth token found');
    return NextResponse.json({ error: 'Verification token not found' }, { status: 401 });
  }

  // Redirect to signin page with verified credentials
  // The credentials provider will handle the authentication
  const callbackUrl = `/auth/signin?email=${encodeURIComponent(email)}&verified=true&code=${encodeURIComponent(code)}`;
  return NextResponse.json({ success: true, redirect: callbackUrl });
} 
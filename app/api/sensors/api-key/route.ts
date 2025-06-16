import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { apiKey } = await request.json();
  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }
  const encrypted = encrypt(apiKey);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { encryptedGoveeApiKey: encrypted },
  });
  return NextResponse.json({ success: true });
} 
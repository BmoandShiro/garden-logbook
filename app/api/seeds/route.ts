import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user) {
      console.log('No session or user found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!session.user.id) {
      console.log('No user ID in session');
      return new NextResponse('Invalid session - no user ID', { status: 401 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!user) {
      console.log('User not found in database:', session.user.id);
      return new NextResponse('User not found', { status: 404 });
    }

    const body = await req.json();
    console.log('Received seed data:', body);
    
    const { variety, strain, batch, breeder, quantity, dateAcquired, dateHarvested, feminized } = body;

    // Validate required fields
    if (!variety || !strain || !batch || !breeder || !quantity || !dateAcquired) {
      const missingFields = {
        variety: !variety,
        strain: !strain,
        batch: !batch,
        breeder: !breeder,
        quantity: !quantity,
        dateAcquired: !dateAcquired,
      };
      console.error('Missing required fields:', missingFields);
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Parse dates
    const parsedDateAcquired = new Date(dateAcquired);
    const parsedDateHarvested = dateHarvested ? new Date(dateHarvested) : null;

    // Validate date parsing
    if (isNaN(parsedDateAcquired.getTime())) {
      console.error('Invalid dateAcquired:', dateAcquired);
      return new NextResponse('Invalid dateAcquired', { status: 400 });
    }

    if (dateHarvested && isNaN(parsedDateHarvested!.getTime())) {
      console.error('Invalid dateHarvested:', dateHarvested);
      return new NextResponse('Invalid dateHarvested', { status: 400 });
    }

    console.log('Creating seed with data:', {
      variety,
      strain,
      batch,
      breeder,
      quantity,
      dateAcquired: parsedDateAcquired,
      dateHarvested: parsedDateHarvested,
      feminized,
      userId: session.user.id,
    });

    const seed = await prisma.seed.create({
      data: {
        variety,
        strain,
        batch,
        breeder,
        quantity,
        dateAcquired: parsedDateAcquired,
        dateHarvested: parsedDateHarvested,
        feminized: feminized ?? false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(seed);
  } catch (error) {
    console.error('[SEEDS_POST] Detailed error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[SEEDS_POST] Prisma error code:', error.code);
      console.error('[SEEDS_POST] Prisma error message:', error.message);
      console.error('[SEEDS_POST] Prisma error meta:', error.meta);
      
      // Handle specific Prisma errors
      switch (error.code) {
        case 'P2002':
          return new NextResponse('A seed with these details already exists', { status: 409 });
        case 'P2003':
          return new NextResponse('User not found or session expired - please log in again', { status: 401 });
        case 'P2025':
          return new NextResponse('Record not found', { status: 404 });
        default:
          return new NextResponse(`Database error: ${error.code}`, { status: 500 });
      }
    }
    
    if (error instanceof Error) {
      console.error('[SEEDS_POST] Error message:', error.message);
      console.error('[SEEDS_POST] Error stack:', error.stack);
      return new NextResponse(error.message, { status: 500 });
    }
    
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const seeds = await prisma.seed.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        createdBy: true,
      },
    });

    return NextResponse.json(seeds);
  } catch (error) {
    console.error('[SEEDS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const [plants, recentLogs] = await Promise.all([
      prisma.plant.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.log.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          plant: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      plants,
      recentLogs,
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 
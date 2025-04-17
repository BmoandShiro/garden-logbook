import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { stringify } from 'csv-stringify/sync';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.log.findMany({
      where: {
        userId,
      },
      include: {
        plant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Convert logs to CSV format
    const csvData = logs.map(log => ({
      Date: new Date(log.date).toISOString(),
      Type: log.type,
      Stage: log.stage,
      Plant: log.plant?.name || 'Unknown',
      Temperature: log.temperature || '',
      Humidity: log.humidity || '',
      pH: log.pH || '',
      EC: log.ec || '',
      PAR: log.par || '',
      'Water Amount': log.waterAmount || '',
      Nutrients: log.nutrients?.join(', ') || '',
      Notes: log.notes || '',
    }));

    const csv = stringify(csvData, {
      header: true,
      columns: [
        'Date',
        'Type',
        'Stage',
        'Plant',
        'Temperature',
        'Humidity',
        'pH',
        'EC',
        'PAR',
        'Water Amount',
        'Nutrients',
        'Notes',
      ],
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="garden-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting logs:', error);
    return NextResponse.json(
      { error: 'Failed to export logs' },
      { status: 500 }
    );
  }
} 
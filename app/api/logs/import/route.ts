import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { parse } from 'csv-parse/sync';
import { LogType, Stage } from '@prisma/client';

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const content = await file.text();
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    // Validate and transform records
    const logs = records.map((record: any) => {
      // Validate required fields
      if (!record.Date || !record.Type || !record.Stage || !record.Plant) {
        throw new Error('Missing required fields');
      }

      // Validate enum values
      if (!Object.values(LogType).includes(record.Type)) {
        throw new Error(`Invalid log type: ${record.Type}`);
      }
      if (!Object.values(Stage).includes(record.Stage)) {
        throw new Error(`Invalid stage: ${record.Stage}`);
      }

      // Find or create plant
      const plant = prisma.plant.findFirst({
        where: {
          name: record.Plant,
          userId,
        },
      });

      if (!plant) {
        throw new Error(`Plant not found: ${record.Plant}`);
      }

      return {
        date: new Date(record.Date),
        type: record.Type as LogType,
        stage: record.Stage as Stage,
        plantId: plant.id,
        temperature: record.Temperature ? parseFloat(record.Temperature) : null,
        humidity: record.Humidity ? parseFloat(record.Humidity) : null,
        pH: record.pH ? parseFloat(record.pH) : null,
        ec: record.EC ? parseFloat(record.EC) : null,
        par: record.PAR ? parseFloat(record.PAR) : null,
        waterAmount: record['Water Amount'] ? parseFloat(record['Water Amount']) : null,
        nutrients: record.Nutrients ? record.Nutrients.split(',').map((n: string) => n.trim()) : [],
        notes: record.Notes || null,
        userId,
      };
    });

    // Create logs in a transaction
    await prisma.$transaction(
      logs.map(log => prisma.log.create({ data: log }))
    );

    return NextResponse.json({ message: 'Logs imported successfully' });
  } catch (error) {
    console.error('Error importing logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import logs' },
      { status: 500 }
    );
  }
} 
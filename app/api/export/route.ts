import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createObjectCsvWriter } from 'csv-writer';
import { join } from 'path';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

export async function GET() {
  try {
    // Create a temporary directory for CSV files
    const tempDir = join(process.cwd(), 'tmp');
    await mkdir(tempDir, { recursive: true });

    // Export each table to CSV
    const tables = [
      { name: 'logs', data: await prisma.log.findMany() },
      { name: 'plants', data: await prisma.plant.findMany() },
      { name: 'zones', data: await prisma.zone.findMany() },
      { name: 'rooms', data: await prisma.room.findMany() },
      { name: 'gardens', data: await prisma.garden.findMany() },
      { name: 'users', data: await prisma.user.findMany() }
    ];

    const csvFiles = [];

    for (const table of tables) {
      const csvPath = join(tempDir, `${table.name}.csv`);
      const csvWriter = createObjectCsvWriter({
        path: csvPath,
        header: Object.keys(table.data[0] || {}).map(key => ({ id: key, title: key }))
      });

      await csvWriter.writeRecords(table.data);
      csvFiles.push(csvPath);
    }

    // Create a zip file containing all CSV files
    const zipPath = join(tempDir, 'database-export.zip');
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    for (const file of csvFiles) {
      const fileName = file.split('/').pop() || '';
      archive.file(file, { name: fileName });
    }

    await archive.finalize();

    // Read the zip file
    const zipBuffer = await readFile(zipPath);

    // Clean up temporary files
    for (const file of csvFiles) {
      await unlink(file);
    }
    await unlink(zipPath);

    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="database-export.zip"'
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export database' }, { status: 500 });
  }
} 
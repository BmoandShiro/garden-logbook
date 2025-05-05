import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';
import { parse } from 'csv-parse/sync';

export const runtime = 'edge'; // Enable edge runtime for streaming

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let csvContents: { name: string; content: string }[] = [];

    if (file.name.endsWith('.zip')) {
      // Unzip and collect all CSV files
      const zip = await JSZip.loadAsync(buffer);
      for (const fileName of Object.keys(zip.files)) {
        if (fileName.endsWith('.csv')) {
          const content = await zip.files[fileName].async('string');
          csvContents.push({ name: fileName, content });
        }
      }
    } else if (file.name.endsWith('.csv')) {
      csvContents.push({ name: file.name, content: buffer.toString('utf-8') });
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const csvFile of csvContents) {
      // Only process logs.csv for now
      if (!csvFile.name.toLowerCase().includes('log')) continue;
      const records = parse(csvFile.content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      for (const record of records) {
        // Check for duplicate: all fields must match
        const where: any = {};
        for (const key of Object.keys(record)) {
          where[key] = record[key] === '' ? null : record[key];
        }
        const exists = await prisma.log.findFirst({ where });
        if (exists) {
          skipped++;
        } else {
          await prisma.log.create({ data: where });
          imported++;
        }
      }
    }

    return NextResponse.json({ success: true, imported, skipped });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import database' }, { status: 500 });
  }
} 
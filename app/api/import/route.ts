import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';
import { parse } from 'csv-parse/sync';
import cuid from 'cuid';

// Mapping of Log model fields to their types
const logFieldTypes: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'json' | 'string[]'> = {
  id: 'string',
  type: 'string',
  stage: 'string',
  temperature: 'number',
  humidity: 'number',
  waterAmount: 'number',
  notes: 'string',
  plantId: 'string',
  userId: 'string',
  createdAt: 'date',
  updatedAt: 'date',
  co2: 'number',
  gardenId: 'string',
  healthRating: 'number',
  height: 'number',
  imageUrls: 'string[]',
  nodeCount: 'number',
  roomId: 'string',
  vpd: 'number',
  width: 'number',
  zoneId: 'string',
  ppfd: 'number',
  runoffPh: 'number',
  waterPh: 'number',
  boosterPpm: 'number',
  data: 'json',
  finishPpm: 'number',
  logDate: 'date',
  partAPpm: 'number',
  partBPpm: 'number',
  partCPpm: 'number',
  runoffPpm: 'number',
  waterPpm: 'number',
  waterTemp: 'number',
  waterSource: 'string',
  waterUnit: 'string',
  waterTemperature: 'number',
  waterTemperatureUnit: 'string',
  sourceWaterPh: 'number',
  nutrientWaterPh: 'number',
  sourceWaterPpm: 'number',
  nutrientWaterPpm: 'number',
  ppmScale: 'string',
  nutrientLine: 'string',
  jacks321Used: 'string[]',
  jacks321Unit: 'string',
  partAAmount: 'number',
  partBAmount: 'number',
  partCAmount: 'number',
  boosterAmount: 'number',
  finishAmount: 'number',
  customNutrients: 'json',
  sourceWaterTemperature: 'number',
  sourceWaterTemperatureUnit: 'string',
  nutrientWaterTemperature: 'number',
  nutrientWaterTemperatureUnit: 'string',
};

function convertValue(value: string, type: string) {
  if (type === 'string[]') {
    if (!value || value === '' || value == null) return [];
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  if (value === '' || value == null) return null;
  switch (type) {
    case 'number':
      return value === '' ? null : Number(value);
    case 'boolean':
      return value.toLowerCase() === 'true';
    case 'date':
      // Accept ISO or JS date string
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    default:
      return value;
  }
}

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
        // Convert types for all fields
        const converted: any = {};
        const where: any = {};
        for (const key of Object.keys(record)) {
          const type = logFieldTypes[key] || 'string';
          const val = convertValue(record[key], type);
          converted[key] = val;
          if (type === 'string[]') {
            where[key] = { equals: val };
          } else if (type === 'json') {
            if (val !== null) {
              where[key] = val;
            }
          } else {
            where[key] = val;
          }
        }
        // If a log with the same id exists, generate a new unique id for the imported log
        if (converted.id) {
          const idExists = await prisma.log.findUnique({ where: { id: converted.id } });
          if (idExists) {
            converted.id = cuid();
          }
        }
        // Check for duplicate: all fields must match (except id)
        const whereForDup = { ...where };
        delete whereForDup.id;
        const exists = await prisma.log.findFirst({ where: whereForDup });
        if (exists) {
          skipped++;
        } else {
          await prisma.log.create({ data: converted });
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
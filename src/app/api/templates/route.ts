import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for template field validation
const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'select', 'multiselect', 'date', 'time', 'checkbox']),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  defaultValue: z.any().optional(),
  unit: z.string().optional(),
});

const TemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  roomId: z.string().optional(),
  fields: z.array(FieldSchema),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = TemplateSchema.parse(body);

    const template = await prisma.logTemplate.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        fields: validatedData.fields,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    const templates = await prisma.logTemplate.findMany({
      where: {
        isActive: true,
        ...(roomId ? { roomId } : {}),
      },
      include: {
        room: true,
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
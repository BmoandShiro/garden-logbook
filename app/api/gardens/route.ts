import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ResourcePermission, Prisma } from "@prisma/client";

// GET /api/gardens - List gardens
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get gardens where user is either the creator or a member
    const gardens = await db.garden.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                permissions: {
                  has: ResourcePermission.VIEW
                }
              }
            }
          }
        ]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        rooms: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            rooms: true,
            members: true
          }
        }
      }
    });

    return NextResponse.json(gardens);
  } catch (error) {
    console.error("Error fetching gardens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/gardens - Create a new garden
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session data:', session);
    
    if (!session?.user) {
      console.log('Unauthorized: No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    const { name, description, isPrivate, imageUrl } = body;

    if (!name) {
      console.log('Validation error: Name is required');
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    console.log('Creating garden with data:', {
      name,
      description,
      isPrivate,
      imageUrl,
      creatorId: session.user.id
    });

    // Create the garden and automatically add creator as a member with all permissions
    const garden = await db.garden.create({
      data: {
        name,
        description,
        isPrivate: isPrivate ?? true,
        imageUrl,
        creatorId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            addedById: session.user.id,
            permissions: Object.values(ResourcePermission)
          }
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    console.log('Garden created successfully:', garden);
    return NextResponse.json(garden);
  } catch (error) {
    console.error('Detailed error creating garden:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Check if it's a Prisma error
    if (error instanceof Error && 'code' in error) {
      const prismaError = error as any;
      console.error('Prisma error code:', prismaError.code);
      
      // Handle specific Prisma errors
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: "A garden with this name already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "../../../lib/db";
import { ResourcePermission } from "@prisma/client";

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
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, isPrivate, imageUrl } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

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

    return NextResponse.json(garden);
  } catch (error) {
    console.error("Error creating garden:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
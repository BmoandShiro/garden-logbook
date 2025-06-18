import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const zones = await prisma.zone.findMany({
      where: {
        creatorId: session.user.id
      },
      include: {
        goveeDevices: {
          select: {
            id: true,
            deviceId: true,
            name: true,
            type: true,
            model: true,
            isActive: true,
            isOnline: true,
            batteryLevel: true,
            lastState: true,
            lastStateAt: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
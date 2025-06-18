import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const zones = await prisma.zone.findMany({
      where: {
        creatorId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        weatherAlertSource: true,
        sensorAlertThresholds: true,
        goveeDevices: {
          select: {
            id: true,
            name: true,
            isOnline: true,
            batteryLevel: true,
            lastStateAt: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 }
    );
  }
} 
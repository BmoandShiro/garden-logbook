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

    const devices = await prisma.goveeDevice.findMany({
      where: {
        userId: session.user.id,
      },
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
        lastStateAt: true,
        linkedEntity: true,
        zoneId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
} 
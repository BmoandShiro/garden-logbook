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

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const zoneId = searchParams.get('zoneId');
    const hours = searchParams.get('hours');
    const limit = searchParams.get('limit');

    // Build the where clause
    const where: any = {
      device: {
        userId: session.user.id
      }
    };

    if (deviceId) {
      where.deviceId = deviceId;
    }

    if (zoneId) {
      where.device = {
        ...where.device,
        zoneId: zoneId
      };
    }

    if (hours) {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - parseInt(hours));
      where.timestamp = {
        gte: hoursAgo
      };
    }

    const readings = await prisma.goveeReading.findMany({
      where,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            type: true,
            model: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit ? parseInt(limit) : 1000
    });

    return NextResponse.json(readings);
  } catch (error) {
    console.error("Error fetching sensor readings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
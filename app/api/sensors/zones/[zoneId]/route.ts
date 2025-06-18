import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { zoneId } = params;
    const body = await request.json();

    // Verify the zone belongs to the user
    const zone = await prisma.zone.findFirst({
      where: {
        id: zoneId,
        creatorId: session.user.id,
      },
    });

    if (!zone) {
      return NextResponse.json(
        { error: "Zone not found" },
        { status: 404 }
      );
    }

    // Update the zone with the provided data
    const updatedZone = await prisma.zone.update({
      where: {
        id: zoneId,
      },
      data: {
        weatherAlertSource: body.weatherAlertSource,
        sensorAlertThresholds: body.sensorAlertThresholds,
      },
      include: {
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
    });

    return NextResponse.json(updatedZone);
  } catch (error) {
    console.error("Error updating zone:", error);
    return NextResponse.json(
      { error: "Failed to update zone" },
      { status: 500 }
    );
  }
} 
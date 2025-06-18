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
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { zoneId } = params;
    const updates = await request.json();

    // Verify the zone exists and user has access
    const zone = await prisma.zone.findFirst({
      where: {
        id: zoneId,
        creatorId: session.user.id
      }
    });

    if (!zone) {
      return NextResponse.json(
        { error: "Zone not found or access denied" },
        { status: 404 }
      );
    }

    // Validate weather alert source
    if (updates.weatherAlertSource && 
        !['WEATHER_API', 'SENSORS', 'BOTH'].includes(updates.weatherAlertSource)) {
      return NextResponse.json(
        { error: "Invalid weather alert source" },
        { status: 400 }
      );
    }

    // Update the zone
    const updatedZone = await prisma.zone.update({
      where: { id: zoneId },
      data: updates
    });

    return NextResponse.json(updatedZone);
  } catch (error) {
    console.error("Error updating zone settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
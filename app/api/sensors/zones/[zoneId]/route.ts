import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createChangeLog, getEntityPath } from "@/lib/changeLogger";

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

    // Get the current zone to track changes
    const currentZone = await prisma.zone.findUnique({
      where: { id: zoneId },
    });

    if (!currentZone) {
      return NextResponse.json({ error: 'Zone not found.' }, { status: 404 });
    }

    // Track changes for logging
    const changes = [];
    if (currentZone.weatherAlertSource !== body.weatherAlertSource) changes.push({ field: 'weatherAlertSource', oldValue: currentZone.weatherAlertSource, newValue: body.weatherAlertSource });
    if (JSON.stringify(currentZone.sensorAlertThresholds) !== JSON.stringify(body.sensorAlertThresholds)) changes.push({ field: 'sensorAlertThresholds', oldValue: currentZone.sensorAlertThresholds, newValue: body.sensorAlertThresholds });
    if (currentZone.usePlantSpecificAlerts !== body.usePlantSpecificAlerts) changes.push({ field: 'usePlantSpecificAlerts', oldValue: currentZone.usePlantSpecificAlerts, newValue: body.usePlantSpecificAlerts });

    // Update the zone with the provided data
    const updatedZone = await prisma.zone.update({
      where: {
        id: zoneId,
      },
      data: {
        weatherAlertSource: body.weatherAlertSource,
        sensorAlertThresholds: body.sensorAlertThresholds,
        ...(body.usePlantSpecificAlerts !== undefined && { usePlantSpecificAlerts: body.usePlantSpecificAlerts }),
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

    // Create change log if there were changes
    if (changes.length > 0) {
      try {
        const path = await getEntityPath('zone', zoneId);
        await createChangeLog({
          entityType: 'zone',
          entityId: zoneId,
          entityName: updatedZone.name,
          changes,
          path,
          changedBy: {
            id: session.user.id,
            name: session.user.name || 'Unknown User',
            email: session.user.email || 'unknown@example.com',
          },
        });
      } catch (error) {
        console.error('Error creating change log:', error);
        // Don't fail the update if logging fails
      }
    }

    return NextResponse.json(updatedZone);
  } catch (error) {
    console.error("Error updating zone:", error);
    return NextResponse.json(
      { error: "Failed to update zone" },
      { status: 500 }
    );
  }
} 
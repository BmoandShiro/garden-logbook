import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceId, zoneId } = await request.json();

    if (!deviceId || !zoneId) {
      return NextResponse.json(
        { error: "Device ID and Zone ID are required" },
        { status: 400 }
      );
    }

    // Verify the device belongs to the user
    const device = await prisma.goveeDevice.findFirst({
      where: {
        id: deviceId,
        userId: session.user.id,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

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

    // Update the device to link it to the zone
    const updatedDevice = await prisma.goveeDevice.update({
      where: {
        id: deviceId,
      },
      data: {
        zoneId: zoneId,
      },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedDevice);
  } catch (error) {
    console.error("Error linking device:", error);
    return NextResponse.json(
      { error: "Failed to link device" },
      { status: 500 }
    );
  }
} 
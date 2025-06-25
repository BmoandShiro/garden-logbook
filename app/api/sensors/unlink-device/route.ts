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

    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
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

    // Update the device to unlink it from the zone
    const updatedDevice = await prisma.goveeDevice.update({
      where: {
        id: deviceId,
      },
      data: {
        zoneId: null,
      },
    });

    return NextResponse.json(updatedDevice);
  } catch (error) {
    console.error("Error unlinking device:", error);
    return NextResponse.json(
      { error: "Failed to unlink device" },
      { status: 500 }
    );
  }
} 
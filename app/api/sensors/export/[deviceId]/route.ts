import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const hours = searchParams.get('hours');

    // Verify the device belongs to the user
    const device = await prisma.goveeDevice.findFirst({
      where: {
        id: deviceId,
        userId: session.user.id
      }
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found or access denied" },
        { status: 404 }
      );
    }

    // Build the where clause
    const where: any = {
      deviceId
    };

    if (hours) {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - parseInt(hours));
      where.timestamp = {
        gte: hoursAgo
      };
    }

    const readings = await prisma.goveeReading.findMany({
      where,
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (format === 'json') {
      return NextResponse.json({
        device: {
          id: device.id,
          name: device.name,
          type: device.type,
          model: device.model
        },
        readings: readings.map((reading: any) => ({
          timestamp: reading.timestamp,
          temperature: reading.temperature,
          humidity: reading.humidity,
          battery: reading.battery,
          source: reading.source
        }))
      });
    } else if (format === 'csv') {
      const csvHeaders = ['Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Battery (%)', 'Source'];
      const csvRows = readings.map((reading: any) => [
        reading.timestamp.toISOString(),
        reading.temperature?.toFixed(2) || '',
        reading.humidity?.toFixed(2) || '',
        reading.battery || '',
        reading.source
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row: any) => row.map((field: any) => `"${field}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sensor-data-${device.name}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'json'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error exporting sensor data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
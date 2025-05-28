import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RoomList from "./components/RoomList";
import CreateRoomButton from "./components/CreateRoomButton";
import LogsListWrapper from '@/app/logs/components/LogsListWrapper';
// @ts-expect-error: no types for zipcode-to-timezone
import zipcodeToTimezone from 'zipcode-to-timezone';

interface GardenPageProps {
  params: {
    gardenId: string;
  };
}

interface GardenMember {
  userId: string;
  gardenId: string;
}

export default async function GardenPage({ params }: GardenPageProps) {
  const { gardenId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/gardens");
  }

  const garden = await prisma.garden.findUnique({
    where: {
      id: gardenId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      members: true,
      rooms: {
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
            },
          },
          cleaningSOPs: {
            select: {
              id: true,
              title: true,
            },
          },
          maintenanceTasks: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              plants: true,
              equipment: true,
              maintenanceTasks: true,
            },
          },
        },
      },
      _count: {
        select: {
          rooms: true,
          members: true,
          plants: true,
        },
      },
    },
  });

  if (!garden) {
    redirect("/gardens");
  }

  // Check if user has access to this garden
  const isCreator = garden.createdBy.id === session.user.id;
  const isMember = garden.members.some((member: GardenMember) => member.userId === session.user.id);

  if (!isCreator && !isMember) {
    redirect("/gardens");
  }

  // Only show logs for rooms the user has access to in this garden
  const accessibleRoomIds = garden.rooms.map((room: { id: string }) => room.id);

  // Fetch 3 most recent logs for each room
  const logsByRoomId: Record<string, any[]> = {};
  for (const room of garden.rooms) {
    const roomLogs = await prisma.log.findMany({
      where: { roomId: room.id },
      orderBy: { logDate: 'desc' },
      take: 3,
      include: {
        plant: { select: { name: true } },
        garden: { select: { name: true, timezone: true, zipcode: true } },
        room: { select: { name: true } },
        zone: { select: { name: true } },
      },
    });
    logsByRoomId[room.id] = roomLogs.map((log: any) => {
      let timezone = log.garden?.timezone || null;
      if (!timezone && log.garden?.zipcode) {
        try {
          timezone = zipcodeToTimezone.lookup(log.garden.zipcode) || null;
        } catch (e) {
          timezone = null;
        }
      }
      return { ...log, timezone };
    });
  }

  // All-encompassing logs for this garden (all rooms)
  const logsRaw = await prisma.log.findMany({
    where: {
      gardenId: gardenId,
      roomId: { in: accessibleRoomIds }
    },
    orderBy: { logDate: 'desc' },
    include: {
      plant: { select: { name: true } },
      garden: { select: { name: true, timezone: true, zipcode: true } },
      room: { select: { name: true } },
      zone: { select: { name: true } },
    },
  });
  const logs = logsRaw.map((log: any) => {
    let timezone = log.garden?.timezone || null;
    if (!timezone && log.garden?.zipcode) {
      try {
        timezone = zipcodeToTimezone.lookup(log.garden.zipcode) || null;
      } catch (e) {
        timezone = null;
      }
    }
    return { ...log, timezone };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-emerald-100">{garden.name}</h1>
          <CreateRoomButton gardenId={gardenId} />
        </div>
        {garden.description && (
          <p className="mt-2 text-emerald-300/70">{garden.description}</p>
        )}
        <div className="mt-4 flex space-x-4">
          <div className="text-sm text-emerald-300/70">
            <span className="font-medium">{garden._count.rooms}</span> rooms
          </div>
          <div className="text-sm text-emerald-300/70">
            <span className="font-medium">{garden._count.plants}</span> plants
          </div>
          <div className="text-sm text-emerald-300/70">
            <span className="font-medium">{garden._count.members}</span> members
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-emerald-100 mb-4">Rooms / Plots</h2>
        <RoomList rooms={garden.rooms} gardenId={gardenId} logsByRoomId={logsByRoomId} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-emerald-100 mb-4">Logs for this Garden</h2>
        <LogsListWrapper logs={logs} />
      </div>
    </div>
  );
} 
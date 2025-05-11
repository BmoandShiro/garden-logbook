import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RoomList from "./components/RoomList";
import CreateRoomButton from "./components/CreateRoomButton";
import LogsListWrapper from '@/app/logs/components/LogsListWrapper';

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
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/gardens");
  }

  const garden = await prisma.garden.findUnique({
    where: {
      id: params.gardenId,
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

  const logs = await prisma.log.findMany({
    where: { gardenId: params.gardenId },
    orderBy: { logDate: 'desc' },
    include: {
      plant: { select: { name: true } },
      garden: { select: { name: true } },
      room: { select: { name: true } },
      zone: { select: { name: true } },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-emerald-100">{garden.name}</h1>
          <CreateRoomButton gardenId={params.gardenId} />
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
        <RoomList rooms={garden.rooms} gardenId={params.gardenId} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-emerald-100 mb-4">Logs for this Garden</h2>
        <LogsListWrapper logs={logs} />
      </div>
    </div>
  );
} 
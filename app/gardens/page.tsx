import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateGardenButton from "./components/CreateGardenButton";
import ManageGardensButton from "./components/ManageGardensButton";
import { GardenList } from "./components/GardenList";
import LogsListWrapper from "@/app/logs/components/LogsListWrapper";

export default async function GardensPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/gardens");
  }

  // Fetch user's gardens
  const gardens = await prisma.garden.findMany({
    where: {
      OR: [
        { creatorId: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      ]
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      },
      _count: {
        select: {
          rooms: true,
          members: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // Fetch recent logs for each garden
  const logsByGardenId: Record<string, any[]> = {};
  for (const garden of gardens) {
    logsByGardenId[garden.id] = await prisma.log.findMany({
      where: { gardenId: garden.id },
      orderBy: { logDate: 'desc' },
      take: 3,
      include: {
        plant: { select: { name: true } },
        garden: { select: { name: true } },
        room: { select: { name: true } },
        zone: { select: { name: true } },
      },
    });
  }

  // Fetch 15 most recent logs across all gardens the user can access
  const allRecentLogs = await prisma.log.findMany({
    where: {
      gardenId: { in: gardens.map((g: { id: string }) => g.id) }
    },
    orderBy: { logDate: 'desc' },
    take: 15,
    include: {
      plant: { select: { name: true } },
      garden: { select: { name: true } },
      room: { select: { name: true } },
      zone: { select: { name: true } },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-100">My Gardens</h1>
        <div className="flex gap-4">
          <CreateGardenButton />
          <ManageGardensButton gardens={gardens} userId={session.user.id} />
        </div>
      </div>
      
      <GardenList gardens={gardens} logsByGardenId={logsByGardenId} />

      {/* All Recent Logs section */}
      <div className="mt-12 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-emerald-100 mb-4">All Recent Logs</h2>
        <div className="bg-dark-bg-secondary border border-emerald-800 rounded-lg p-4">
          <LogsListWrapper logs={allRecentLogs} />
        </div>
      </div>
    </div>
  );
} 
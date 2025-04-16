import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateGardenButton from "./components/CreateGardenButton";
import { GardenList } from "./components/GardenList";

export default async function GardensPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
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
      members: true,
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-100">My Gardens</h1>
        <CreateGardenButton />
      </div>
      
      <GardenList gardens={gardens} />
    </div>
  );
} 
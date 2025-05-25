import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Force dynamic route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get farms for this user
    const farms = await prisma.farm.findMany({
      where: {
        userId: user.id,
      },
      select: { id: true },
    });

    const farmIds = farms.map((farm) => farm.id);

    // For each farm, get the latest soil data
    const recentSoilDataPromises = farmIds.map(async (farmId) => {
      const latestReading = await prisma.soilData.findFirst({
        where: {
          farmId: farmId,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      return latestReading;
    });

    // Wait for all promises to resolve
    const recentSoilData = (await Promise.all(recentSoilDataPromises)).filter(
      Boolean
    );

    return NextResponse.json({
      data: recentSoilData,
    });
  } catch (error) {
    console.error("Error fetching recent soil data:", error);
    return NextResponse.json(
      { error: "Error fetching recent soil data" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET handler for fetching soil data for a farm
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if farm exists and belongs to user
    const farm = await prisma.farm.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!farm) {
      return NextResponse.json(
        { error: "Farm not found" },
        { status: 404 }
      );
    }

    // Get soil data for the farm, limit to the most recent 20 readings
    const soilData = await prisma.soilData.findMany({
      where: {
        farmId: params.id,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 20,
    });

    return NextResponse.json({
      data: soilData,
      total: soilData.length,
    });
  } catch (error) {
    console.error("Error fetching soil data:", error);
    return NextResponse.json(
      { error: "Error fetching soil data" },
      { status: 500 }
    );
  }
} 
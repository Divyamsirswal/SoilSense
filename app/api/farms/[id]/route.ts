import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// GET handler for fetching a single farm
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

    // Get farm with counts
    const farm = await prisma.farm.findUnique({
      where: {
        id: params.id,
        userId: user.id, // Ensure the farm belongs to the user
      },
      include: {
        _count: {
          select: {
            devices: true,
            soilData: true,
            zones: true,
            crops: true,
          },
        },
      },
    });

    if (!farm) {
      return NextResponse.json(
        { error: "Farm not found" },
        { status: 404 }
      );
    }

    // Get the latest soil data reading for this farm
    const latestSoilData = await prisma.soilData.findFirst({
      where: {
        farmId: params.id,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Add lastReading to farm data
    const farmWithLastReading = {
      ...farm,
      lastReading: latestSoilData?.timestamp || null,
    };

    return NextResponse.json({
      farm: farmWithLastReading
    });
  } catch (error) {
    console.error("Error fetching farm:", error);
    return NextResponse.json(
      { error: "Error fetching farm" },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a farm
export async function DELETE(
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

    // Delete farm
    await prisma.farm.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting farm:", error);
    return NextResponse.json(
      { error: "Error deleting farm" },
      { status: 500 }
    );
  }
} 
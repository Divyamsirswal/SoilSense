import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Soil data ID is required" },
        { status: 400 }
      );
    }

    // Get the user to verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the soil data with all related data
    const soilData = await prisma.soilData.findUnique({
      where: { id },
      include: {
        device: {
          include: {
            farm: true,
          },
        },
        MLRecommendation: true,
      },
    });

    if (!soilData) {
      return NextResponse.json(
        { error: "Soil data not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (soilData.device.farm.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to access this soil data" },
        { status: 403 }
      );
    }

    return NextResponse.json({ soilData });
  } catch (error) {
    console.error("Error fetching soil data:", error);
    return NextResponse.json(
      { error: "Failed to fetch soil data" },
      { status: 500 }
    );
  }
} 
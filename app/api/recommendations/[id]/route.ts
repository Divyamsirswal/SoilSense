import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recommendationId = params.id;

    const recommendation = await prisma.recommendation.findUnique({
      where: {
        id: recommendationId,
        soilData: {
          farm: {
            userId: session.user.id,
          },
        },
      },
      include: {
        soilData: {
          select: {
            id: true,
            pH: true,
            moisture: true,
            temperature: true,
            nitrogen: true,
            phosphorus: true,
            potassium: true,
            organicMatter: true,
            conductivity: true,
            timestamp: true,
            quality: true,
            farm: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
            device: {
              select: {
                id: true,
                name: true,
                deviceType: true,
              },
            },
          },
        },
      },
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("Error fetching recommendation:", error);
    return NextResponse.json(
      { error: "Error fetching recommendation" },
      { status: 500 }
    );
  }
}

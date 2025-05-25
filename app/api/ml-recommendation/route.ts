import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

// Validation schema for ML recommendation request
const mlRecommendationRequestSchema = z.object({
  soilDataId: z.string(),
});

// ML API configuration
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

// Helper function to process JSON data into a React-friendly format
function processJsonData(data: any) {
  if (!data) return null;

  // Process alternatives array
  if (data.alternatives) {
    if (typeof data.alternatives === "string") {
      try {
        data.alternatives = JSON.parse(data.alternatives);
      } catch (e) {
        data.alternatives = [];
      }
    }

    // Ensure alternatives is an array
    if (!Array.isArray(data.alternatives)) {
      data.alternatives = Object.entries(data.alternatives).map(
        ([key, value]) => ({
          crop: key,
          confidence: typeof value === "number" ? value : 0,
        })
      );
    }
  } else {
    // Ensure alternatives is always an array
    data.alternatives = [];
  }

  // Process advice object
  if (data.advice) {
    if (typeof data.advice === "string") {
      try {
        data.advice = JSON.parse(data.advice);
      } catch (e) {
        data.advice = {};
      }
    }

    // Standardize advice format
    Object.entries(data.advice).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        data.advice[key] = "";
        return;
      }

      // Convert primitives to strings
      if (typeof value !== "object") {
        data.advice[key] = String(value);
        return;
      }

      // Handle the {reasoning, recommendation} structure
      if (
        typeof value === "object" &&
        value !== null &&
        ('reasoning' in value || 'recommendation' in value)
      ) {
        const processedValue: Record<string, string> = {};
        const typedValue = value as Record<string, any>;

        if ('reasoning' in typedValue) {
          processedValue.reasoning =
            typeof typedValue.reasoning === "string"
              ? typedValue.reasoning
              : JSON.stringify(typedValue.reasoning);
        }

        if ('recommendation' in typedValue) {
          processedValue.recommendation =
            typeof typedValue.recommendation === "string"
              ? typedValue.recommendation
              : JSON.stringify(typedValue.recommendation);
        }

        data.advice[key] = processedValue;
        return;
      }

      // Handle other object types
      const processedValue: Record<string, string> = {};
      Object.entries(value as Record<string, any>).forEach(
        ([subKey, subValue]) => {
          processedValue[subKey] =
            typeof subValue === "string" ? subValue : JSON.stringify(subValue);
        }
      );
      data.advice[key] = processedValue;
    });
  } else {
    data.advice = {};
  }

  return data;
}

export async function POST(request: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { soilDataId } = body;

    if (!soilDataId) {
      return NextResponse.json(
        { error: "soilDataId is required" },
        { status: 400 }
      );
    }

    // Get the soil data
    const soilData = await prisma.soilData.findUnique({
      where: { id: soilDataId },
      include: {
        device: {
          include: {
            farm: true,
          },
        },
      },
    });

    if (!soilData) {
      return NextResponse.json(
        { error: "Soil data not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || soilData.device.farm.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to access this soil data" },
        { status: 403 }
      );
    }

    // Check if recommendation already exists
    const existingRecommendation = await prisma.mLRecommendation.findFirst({
      where: { soilDataId },
    });

    if (existingRecommendation) {
      return NextResponse.json({ recommendation: existingRecommendation });
    }

    // Call ML API to get recommendations
    const response = await fetch(`${ML_API_URL}/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ph: soilData.pH,
        temperature: soilData.temperature,
        humidity: soilData.moisture,
        nitrogen: soilData.nitrogen,
        phosphorus: soilData.phosphorus,
        potassium: soilData.potassium,
        organic_matter: soilData.organicMatter || null,
        conductivity: soilData.conductivity || null,
        salinity: soilData.salinity || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ML API error:", errorText);
      return NextResponse.json(
        { error: "Failed to get ML recommendations" },
        { status: 500 }
      );
    }

    const mlResponse = await response.json();

    // Create ML recommendation in database
    const recommendation = await prisma.mLRecommendation.create({
      data: {
        soilDataId,
        recommendedCrop: mlResponse.recommended_crop,
        confidence: mlResponse.confidence || 85,
        alternatives: mlResponse.alternatives || [],
        advice: {
          growing: mlResponse.advice.growing || "",
          fertilization: mlResponse.advice.fertilization || "",
          irrigation: mlResponse.advice.irrigation || "",
        },
        modelType: "RandomForest-v1",
        timestamp: new Date(),
      },
    });

    // Send real-time notification if possible
    try {
      await pusherServer.trigger(`user-${user.id}`, "new-recommendation", {
        recommendation,
      });
    } catch (err) {
      console.error("Pusher notification error:", err);
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("Error generating ML recommendation:", error);
    return NextResponse.json(
      { error: "Failed to generate ML recommendation" },
      { status: 500 }
    );
  }
}

// GET handler for retrieving ML recommendations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const soilDataId = searchParams.get("soilDataId");

    if (soilDataId) {
      // Get recommendation for specific soil data
      const soilData = await prismaClient.soilData.findUnique({
        where: {
          id: soilDataId,
          farm: {
            userId: session.user.id,
          },
        },
        include: {
          MLRecommendation: true,
        },
      });

      if (!soilData) {
        return NextResponse.json(
          { error: "Soil data not found" },
          { status: 404 }
        );
      }

      if (!soilData.MLRecommendation) {
        return NextResponse.json(
          { message: "No ML recommendation found for this soil data" },
          { status: 200 }
        );
      }

      const processedRecommendation = processJsonData(
        soilData.MLRecommendation
      );

      return NextResponse.json({
        recommendations: processedRecommendation
          ? [processedRecommendation]
          : [],
      });
    } else {
      // Get all recommendations for the user's farms
      const recommendations = await prismaClient.mLRecommendation.findMany({
        where: {
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
              timestamp: true,
              farmId: true,
              farm: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 10,
      });

      const processedRecommendations = recommendations.map((rec) =>
        processJsonData(rec)
      );

      return NextResponse.json({
        recommendations: processedRecommendations,
      });
    }
  } catch (error) {
    console.error("Error fetching ML recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch ML recommendations" },
      { status: 500 }
    );
  }
}

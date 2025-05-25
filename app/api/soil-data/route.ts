import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for creating soil data
const createSoilDataSchema = z.object({
  pH: z.number().min(0).max(14),
  nitrogen: z.number().min(0),
  phosphorus: z.number().min(0),
  potassium: z.number().min(0),
  moisture: z.number().min(0).max(100),
  temperature: z.number(),
  organicMatter: z.number().min(0).max(100).optional(),
  conductivity: z.number().min(0).optional(),
  salinity: z.number().min(0).optional(),
  deviceId: z.string(),
  farmId: z.string(),
  zoneId: z.string().optional(),
  depth: z.number().min(0).optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  timestamp: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
});

// Helper function to calculate soil quality
function calculateSoilQuality(data: any) {
  let score = 0;
  let maxScore = 0;

  // pH (optimal range 6.0-7.5)
  if (data.pH !== undefined) {
    maxScore += 10;
    if (data.pH >= 6.0 && data.pH <= 7.5) {
      score += 10;
    } else if (
      (data.pH >= 5.5 && data.pH < 6.0) ||
      (data.pH > 7.5 && data.pH <= 8.0)
    ) {
      score += 7;
    } else if (
      (data.pH >= 5.0 && data.pH < 5.5) ||
      (data.pH > 8.0 && data.pH <= 8.5)
    ) {
      score += 4;
    } else {
      score += 1;
    }
  }

  // Nitrogen (optimal range 30-60 ppm)
  if (data.nitrogen !== undefined) {
    maxScore += 10;
    if (data.nitrogen >= 30 && data.nitrogen <= 60) {
      score += 10;
    } else if (
      (data.nitrogen >= 20 && data.nitrogen < 30) ||
      (data.nitrogen > 60 && data.nitrogen <= 80)
    ) {
      score += 7;
    } else if (
      (data.nitrogen >= 10 && data.nitrogen < 20) ||
      (data.nitrogen > 80 && data.nitrogen <= 100)
    ) {
      score += 4;
    } else {
      score += 1;
    }
  }

  // Phosphorus (optimal range 20-40 ppm)
  if (data.phosphorus !== undefined) {
    maxScore += 10;
    if (data.phosphorus >= 20 && data.phosphorus <= 40) {
      score += 10;
    } else if (
      (data.phosphorus >= 15 && data.phosphorus < 20) ||
      (data.phosphorus > 40 && data.phosphorus <= 50)
    ) {
      score += 7;
    } else if (
      (data.phosphorus >= 10 && data.phosphorus < 15) ||
      (data.phosphorus > 50 && data.phosphorus <= 60)
    ) {
      score += 4;
    } else {
      score += 1;
    }
  }

  // Potassium (optimal range 150-250 ppm)
  if (data.potassium !== undefined) {
    maxScore += 10;
    if (data.potassium >= 150 && data.potassium <= 250) {
      score += 10;
    } else if (
      (data.potassium >= 100 && data.potassium < 150) ||
      (data.potassium > 250 && data.potassium <= 300)
    ) {
      score += 7;
    } else if (
      (data.potassium >= 50 && data.potassium < 100) ||
      (data.potassium > 300 && data.potassium <= 350)
    ) {
      score += 4;
    } else {
      score += 1;
    }
  }

  // Moisture (optimal range 50-70%)
  if (data.moisture !== undefined) {
    maxScore += 10;
    if (data.moisture >= 50 && data.moisture <= 70) {
      score += 10;
    } else if (
      (data.moisture >= 40 && data.moisture < 50) ||
      (data.moisture > 70 && data.moisture <= 80)
    ) {
      score += 7;
    } else if (
      (data.moisture >= 30 && data.moisture < 40) ||
      (data.moisture > 80 && data.moisture <= 90)
    ) {
      score += 4;
    } else {
      score += 1;
    }
  }

  // Calculate final quality
  const qualityPercent = (score / maxScore) * 100;

  if (qualityPercent >= 90) return "EXCELLENT";
  if (qualityPercent >= 70) return "GOOD";
  if (qualityPercent >= 50) return "FAIR";
  return "POOR";
}

// GET handler for fetching soil data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");
    const zoneId = searchParams.get("zoneId");
    const deviceId = searchParams.get("deviceId");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : undefined;
    const to = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : undefined;

    // Build where clause
    const where: any = {
      farm: {
        userId: session.user.id,
      },
    };

    if (farmId) {
      where.farmId = farmId;
    }

    if (zoneId) {
      where.zoneId = zoneId;
    }

    if (deviceId) {
      where.deviceId = deviceId;
    }

    // Date range filter
    if (from || to) {
      where.timestamp = {};

      if (from) {
        where.timestamp.gte = from;
      }

      if (to) {
        where.timestamp.lte = to;
      }
    }

    const soilData = await prisma.soilData.findMany({
      where,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            deviceType: true,
          },
        },
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ soilData });
  } catch (error) {
    console.error("Error fetching soil data:", error);
    return NextResponse.json(
      { error: "Error fetching soil data" },
      { status: 500 }
    );
  }
}

// POST handler for creating soil data
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = createSoilDataSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify that the farm belongs to the user
    const farm = await prisma.farm.findUnique({
      where: {
        id: data.farmId,
        userId: session.user.id,
      },
    });

    if (!farm) {
      return NextResponse.json(
        { error: "Farm not found or does not belong to the user" },
        { status: 403 }
      );
    }

    // Verify that the device exists and belongs to the farm
    const device = await prisma.device.findUnique({
      where: {
        id: data.deviceId,
        farmId: data.farmId,
      },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found or does not belong to the specified farm" },
        { status: 400 }
      );
    }

    // If zoneId is provided, verify it belongs to the farm
    if (data.zoneId) {
      const zone = await prisma.zone.findUnique({
        where: {
          id: data.zoneId,
          farmId: data.farmId,
        },
      });

      if (!zone) {
        return NextResponse.json(
          { error: "Zone not found or does not belong to the specified farm" },
          { status: 400 }
        );
      }
    }

    // Calculate soil quality
    const quality = calculateSoilQuality(data);

    // Create the soil data
    const soilData = await prisma.soilData.create({
      data: {
        ...data,
        quality,
      },
    });

    // Update device last active time
    await prisma.device.update({
      where: { id: data.deviceId },
      data: { lastActive: new Date() },
    });

    // Generate recommendation based on soil data
    const recommendationData = {
      soilDataId: soilData.id,
      // Generate recommendations based on soil data
      crops: generateRecommendedCrops(data),
      score: 85, // Example score
      remarks: generateRemarks(data, quality),
      fertilizers: generateFertilizerRecommendations(data),
      irrigation: generateIrrigationRecommendations(data),
      aiModelVersion: "1.0.0",
    };

    // Create recommendation
    await prisma.recommendation.create({
      data: recommendationData,
    });

    // Return created soil data with recommendation
    const result = await prisma.soilData.findUnique({
      where: { id: soilData.id },
      include: {
        recommendation: true,
        device: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating soil data:", error);
    return NextResponse.json(
      { error: "Error creating soil data" },
      { status: 500 }
    );
  }
}

// Helper function to generate crop recommendations
function generateRecommendedCrops(soilData: any) {
  const pH = soilData.pH;
  const moisture = soilData.moisture;

  const crops = [];

  // Acidic soils (pH < 6.0)
  if (pH < 6.0) {
    crops.push("Potatoes", "Blueberries");
    if (moisture > 60) crops.push("Rice");
  }
  // Neutral soils (pH 6.0-7.0)
  else if (pH >= 6.0 && pH <= 7.0) {
    crops.push("Wheat", "Corn", "Soybeans");
    if (moisture > 50) crops.push("Tomatoes", "Peppers");
    else crops.push("Beans", "Sunflowers");
  }
  // Alkaline soils (pH > 7.0)
  else {
    crops.push("Spinach", "Cabbage", "Cauliflower");
    if (moisture < 50) crops.push("Barley");
  }

  return crops;
}

// Helper function to generate remarks
function generateRemarks(soilData: any, quality: string) {
  let remarks = `Soil quality is ${quality.toLowerCase()}. `;

  // pH remarks
  if (soilData.pH < 5.5) {
    remarks += "Soil is too acidic, consider adding lime to raise pH. ";
  } else if (soilData.pH > 7.5) {
    remarks += "Soil is too alkaline, consider adding sulfur to lower pH. ";
  } else {
    remarks += "Soil pH is in optimal range. ";
  }

  // NPK remarks
  if (soilData.nitrogen < 30) {
    remarks +=
      "Nitrogen levels are low, consider adding nitrogen-rich fertilizers. ";
  }

  if (soilData.phosphorus < 20) {
    remarks +=
      "Phosphorus levels are low, consider adding phosphate fertilizers. ";
  }

  if (soilData.potassium < 150) {
    remarks += "Potassium levels are low, consider adding potash fertilizers. ";
  }

  // Moisture remarks
  if (soilData.moisture < 40) {
    remarks += "Soil moisture is low, consider increasing irrigation. ";
  } else if (soilData.moisture > 80) {
    remarks += "Soil moisture is high, consider improving drainage. ";
  }

  return remarks;
}

// Helper function to generate fertilizer recommendations
function generateFertilizerRecommendations(soilData: any) {
  const recommendations: any = {};

  // Nitrogen recommendations
  if (soilData.nitrogen < 20) {
    recommendations.nitrogen = {
      level: "Very Low",
      recommendation:
        "Apply high-nitrogen fertilizer such as urea (46-0-0) at 50kg/ha",
    };
  } else if (soilData.nitrogen < 30) {
    recommendations.nitrogen = {
      level: "Low",
      recommendation:
        "Apply balanced fertilizer such as NPK (20-10-10) at 100kg/ha",
    };
  } else if (soilData.nitrogen > 80) {
    recommendations.nitrogen = {
      level: "High",
      recommendation: "Reduce nitrogen application in next cycle",
    };
  } else {
    recommendations.nitrogen = {
      level: "Optimal",
      recommendation: "Maintain current fertility program",
    };
  }

  // Phosphorus recommendations
  if (soilData.phosphorus < 15) {
    recommendations.phosphorus = {
      level: "Very Low",
      recommendation:
        "Apply high-phosphate fertilizer such as triple super phosphate (0-45-0) at 40kg/ha",
    };
  } else if (soilData.phosphorus < 20) {
    recommendations.phosphorus = {
      level: "Low",
      recommendation:
        "Apply balanced fertilizer with higher phosphorus such as NPK (10-20-10) at 75kg/ha",
    };
  } else if (soilData.phosphorus > 50) {
    recommendations.phosphorus = {
      level: "High",
      recommendation: "Reduce phosphorus application in next cycle",
    };
  } else {
    recommendations.phosphorus = {
      level: "Optimal",
      recommendation: "Maintain current fertility program",
    };
  }

  // Potassium recommendations
  if (soilData.potassium < 100) {
    recommendations.potassium = {
      level: "Very Low",
      recommendation:
        "Apply potash fertilizer such as muriate of potash (0-0-60) at 60kg/ha",
    };
  } else if (soilData.potassium < 150) {
    recommendations.potassium = {
      level: "Low",
      recommendation:
        "Apply balanced fertilizer with higher potassium such as NPK (10-10-20) at 80kg/ha",
    };
  } else if (soilData.potassium > 300) {
    recommendations.potassium = {
      level: "High",
      recommendation: "Reduce potassium application in next cycle",
    };
  } else {
    recommendations.potassium = {
      level: "Optimal",
      recommendation: "Maintain current fertility program",
    };
  }

  return recommendations;
}

// Helper function to generate irrigation recommendations
function generateIrrigationRecommendations(soilData: any) {
  const recommendations: any = {};

  // Basic moisture level recommendations
  if (soilData.moisture < 30) {
    recommendations.frequency = "Daily";
    recommendations.amount = "High";
    recommendations.notes =
      "Soil is very dry. Immediate irrigation needed. Consider drip irrigation system for efficient water use.";
  } else if (soilData.moisture < 50) {
    recommendations.frequency = "Every 2-3 days";
    recommendations.amount = "Moderate";
    recommendations.notes =
      "Soil moisture is below optimal. Regular irrigation schedule recommended.";
  } else if (soilData.moisture < 70) {
    recommendations.frequency = "Every 4-5 days";
    recommendations.amount = "Low to Moderate";
    recommendations.notes =
      "Soil moisture is at optimal levels. Maintain current irrigation practices.";
  } else {
    recommendations.frequency = "As needed";
    recommendations.amount = "Low";
    recommendations.notes =
      "Soil moisture is high. Reduce irrigation and monitor for potential drainage issues.";
  }

  return recommendations;
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import OpenAI from "openai";
import { pusherServer } from "@/lib/pusher";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schema for recommendation request
const recommendationRequestSchema = z.object({
  soilDataId: z.string(),
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    // Validate request body
    const validationResult = recommendationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { soilDataId } = validationResult.data;

    // Get soil data with farm information
    const soilData = await prisma.soilData.findUnique({
      where: { id: soilDataId },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
            climate: true,
            userId: true,
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

    // Check if the user has permission to access this farm's data
    if (soilData.farm.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to access this farm data" },
        { status: 403 }
      );
    }

    // Check for existing recommendation
    const existingRecommendation = await prisma.recommendation.findUnique({
      where: { soilDataId },
    });

    if (existingRecommendation) {
      return NextResponse.json(
        {
          recommendation: existingRecommendation,
          message: "Recommendation already exists for this soil data",
        },
        { status: 200 }
      );
    }

    // Get recent weather data
    const weatherData = await prisma.weatherData.findMany({
      where: {
        farmId: soilData.farmId,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });

    // Get information about crops commonly grown in the region
    const regionalCrops = await getRegionalCrops(soilData.farm.location);

    // Generate AI recommendation
    const recommendation = await generateAIRecommendation(
      soilData,
      weatherData,
      regionalCrops
    );

    // Save recommendation to database
    const savedRecommendation = await prisma.recommendation.create({
      data: {
        soilDataId,
        crops: recommendation.crops,
        score: recommendation.score,
        remarks: recommendation.remarks,
        fertilizers: recommendation.fertilizers,
        irrigation: recommendation.irrigation,
        pestManagement: recommendation.pestManagement,
        expectedYield: recommendation.expectedYield,
        carbonFootprint: recommendation.carbonFootprint,
        sustainabilityScore: recommendation.sustainabilityScore,
        aiModelVersion: "gpt-4-turbo",
      },
    });

    // Trigger real-time notification
    await pusherServer.trigger(
      `farm-${soilData.farmId}`,
      "new-recommendation",
      {
        recommendation: savedRecommendation,
      }
    );

    // Create an alert about the new recommendation
    await prisma.alert.create({
      data: {
        type: "NEW_RECOMMENDATION",
        message: `New crop and fertilizer recommendations available for soil data from ${new Date(
          soilData.timestamp
        ).toLocaleDateString()}`,
        severity: "INFO",
        isRead: false,
        userId: soilData.farm.userId,
        farmId: soilData.farmId,
        soilDataId,
      },
    });

    return NextResponse.json(
      {
        recommendation: savedRecommendation,
        message: "Recommendation generated successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Recommendation generation error:", error);
    return NextResponse.json(
      { error: "An error occurred during recommendation generation" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve recommendations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;

    // Build query
    const where: any = {
      soilData: {
        farm: {
          userId: session.user.id,
        },
      },
    };

    // Add farmId filter if provided
    if (farmId) {
      where.soilData.farmId = farmId;
    }

    const recommendations = await prisma.recommendation.findMany({
      where,
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
            timestamp: true,
            quality: true,
            farm: {
              select: {
                id: true,
                name: true,
              },
            },
            device: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Error fetching recommendations" },
      { status: 500 }
    );
  }
}

// GET handler for a specific recommendation by ID
export async function GET_ID(
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

// Function to get information about crops commonly grown in a region
async function getRegionalCrops(location: string) {
  // In a real system, this would query an agricultural database or API
  // For this example, we'll use some hardcoded data based on location
  const regionMap = {
    Karnataka: ["Rice", "Millet", "Sugarcane", "Cotton", "Sunflower"],
    Punjab: ["Wheat", "Rice", "Cotton", "Sugarcane", "Maize"],
    Maharashtra: ["Cotton", "Sugarcane", "Soybeans", "Pulses", "Jowar"],
    default: ["Rice", "Wheat", "Maize", "Pulses", "Oilseeds"],
  };

  // Try to match the location to our known regions
  for (const [region, crops] of Object.entries(regionMap)) {
    if (location.includes(region)) {
      return crops;
    }
  }

  // Default crops if no region match
  return regionMap.default;
}

// Function to generate AI recommendation using OpenAI
async function generateAIRecommendation(soilData, weatherData, regionalCrops) {
  try {
    // Prepare the data for the AI model
    const soilInfo = {
      pH: soilData.pH,
      nitrogen: soilData.nitrogen,
      phosphorus: soilData.phosphorus,
      potassium: soilData.potassium,
      moisture: soilData.moisture,
      temperature: soilData.temperature,
      organicMatter: soilData.organicMatter,
      conductivity: soilData.conductivity,
      salinity: soilData.salinity,
    };

    const weatherSummary =
      weatherData.length > 0
        ? {
            avgTemperature:
              weatherData.reduce((sum, data) => sum + data.temperature, 0) /
              weatherData.length,
            avgHumidity:
              weatherData.reduce((sum, data) => sum + data.humidity, 0) /
              weatherData.length,
            totalPrecipitation: weatherData.reduce(
              (sum, data) => sum + data.precipitation,
              0
            ),
            recentConditions: weatherData[0]?.conditions,
          }
        : { note: "No recent weather data available" };

    // Construct the prompt
    const prompt = `You are an advanced agricultural expert system. Based on the following soil and weather data, provide recommendations for suitable crops, fertilizers, and farming practices.

SOIL DATA:
${JSON.stringify(soilInfo, null, 2)}

RECENT WEATHER DATA:
${JSON.stringify(weatherSummary, null, 2)}

REGIONAL CROPS:
${regionalCrops.join(", ")}

LOCATION:
${soilData.farm.location}

CLIMATE:
${soilData.farm.climate || "Information not available"}

Please provide comprehensive recommendations in the following JSON format:
{
  "crops": ["crop1", "crop2", "crop3"], // List of 3-5 most suitable crops
  "score": 85, // Confidence score (0-100)
  "remarks": "General observations and remarks",
  "fertilizers": {
    "recommendations": [
      {"type": "fertilizer name", "amount": "application rate", "timing": "when to apply"}
    ]
  },
  "irrigation": {
    "schedule": "Recommended irrigation schedule",
    "method": "Suggested irrigation method",
    "amount": "Water amount per application"
  },
  "pestManagement": {
    "potentialIssues": ["pest1", "pest2"],
    "preventiveMeasures": ["measure1", "measure2"]
  },
  "expectedYield": {
    "crops": {
      "crop1": {"yield": "estimated yield", "unit": "unit of measurement"},
      "crop2": {"yield": "estimated yield", "unit": "unit of measurement"}
    }
  },
  "carbonFootprint": 45.5, // Estimated carbon footprint (0-100, lower is better)
  "sustainabilityScore": 78.5 // Sustainability score (0-100, higher is better)
}`;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an agricultural AI assistant specializing in soil science, crop selection, and sustainable farming practices.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    // Parse the response
    const recommendation = JSON.parse(response.choices[0].message.content);

    return recommendation;
  } catch (error) {
    console.error("Error generating AI recommendation:", error);

    // Provide a fallback recommendation
    return {
      crops: regionalCrops.slice(0, 3),
      score: 60,
      remarks:
        "Generated based on regional data only due to AI processing error.",
      fertilizers: {
        recommendations: [
          {
            type: "NPK balanced fertilizer",
            amount: "Standard application",
            timing: "Before planting",
          },
        ],
      },
      irrigation: {
        schedule: "Regular irrigation as needed",
        method: "Drip irrigation if available",
        amount: "As required based on soil moisture levels",
      },
      pestManagement: {
        potentialIssues: ["Common regional pests"],
        preventiveMeasures: [
          "Regular monitoring",
          "Integrated pest management",
        ],
      },
      expectedYield: {
        crops: {},
      },
      carbonFootprint: 50,
      sustainabilityScore: 50,
    };
  }
}

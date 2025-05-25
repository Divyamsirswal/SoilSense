import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

// Force dynamic route
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface WeatherCondition {
  conditions: string;
  icon: string;
}

interface WeatherAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  details: string;
}

interface WeatherDataWithExtras extends WeatherData {
  conditions?: string;
  icon?: string;
  maxTemp?: number;
  minTemp?: number;
  avgTemp?: number;
  farm?: {
    name: string;
    location: string;
  };
}

interface WeatherData {
  id: string;
  farmId: string;
  date: Date;
  temperature: number;
  humidity: number;
  precipitation: number;
  forecast: boolean;
}

// Weather conditions based on parameters
function determineWeatherCondition(
  temperature: number,
  humidity: number,
  precipitation: number
): WeatherCondition {
  if (precipitation > 70)
    return { conditions: "Heavy Rain", icon: "cloud-rain" };
  if (precipitation > 40)
    return { conditions: "Rain Showers", icon: "cloud-rain" };
  if (precipitation > 20)
    return { conditions: "Scattered Showers", icon: "cloud-drizzle" };
  if (humidity > 80) return { conditions: "Cloudy", icon: "cloud" };
  if (humidity > 60) return { conditions: "Partly Cloudy", icon: "cloud" };
  return { conditions: "Sunny", icon: "sun" };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");
    const type = searchParams.get("type") || "all"; // all, current, forecast, historical

    // Build the query
    const query: any = {
      where: {
        farmId: {
          in: farmId
            ? [farmId]
            : await prisma.farm
                .findMany({
                  where: { userId: session.user.id },
                  select: { id: true },
                })
                .then((farms) => farms.map((farm) => farm.id)),
        },
      },
      include: {
        farm: {
          select: { name: true, location: true },
        },
      },
      orderBy: {
        date: "desc",
      },
    };

    // Get current weather (most recent non-forecast record)
    let current: WeatherDataWithExtras | null = null;
    if (type === "all" || type === "current") {
      const currentData = await prisma.weatherData.findFirst({
        where: {
          ...query.where,
          forecast: false,
        },
        include: query.include,
        orderBy: query.orderBy,
      });

      if (currentData) {
        const condition = determineWeatherCondition(
          currentData.temperature,
          currentData.humidity,
          currentData.precipitation
        );

        current = {
          ...currentData,
          conditions: condition.conditions,
          icon: condition.icon,
        };
      }
    }

    // Get forecast data (next 7 days)
    let forecast: WeatherDataWithExtras[] = [];
    if (type === "all" || type === "forecast") {
      const forecastData = await prisma.weatherData.findMany({
        where: {
          ...query.where,
          forecast: true,
          date: {
            gte: new Date(),
          },
        },
        include: query.include,
        orderBy: {
          date: "asc",
        },
        take: 7,
      });

      forecast = forecastData.map((data) => {
        const condition = determineWeatherCondition(
          data.temperature,
          data.humidity,
          data.precipitation
        );

        return {
          ...data,
          conditions: condition.conditions,
          icon: condition.icon,
          maxTemp: Math.round(data.temperature + 2), // Simple approximation
          minTemp: Math.round(data.temperature - 2), // Simple approximation
        };
      });
    }

    // Get historical data (past 7 days)
    let historical: WeatherDataWithExtras[] = [];
    if (type === "all" || type === "historical") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const historicalData = await prisma.weatherData.findMany({
        where: {
          ...query.where,
          forecast: false,
          date: {
            gte: sevenDaysAgo,
            lt: new Date(),
          },
        },
        include: query.include,
        orderBy: {
          date: "desc",
        },
      });

      historical = historicalData.map((data) => ({
        ...data,
        avgTemp: data.temperature, // Using temperature as avgTemp
      }));
    }

    // Generate an alert if there's high precipitation in the forecast
    let alerts: WeatherAlert[] = [];
    if (forecast.some((day) => day.precipitation > 60)) {
      alerts.push({
        id: "weather-alert-1",
        type: "HEAVY_RAIN",
        severity: "WARNING",
        message: "Heavy rainfall expected in the next few days",
        details:
          "Consider taking precautions to protect crops and equipment from potential flooding or water damage.",
      });
    }

    return NextResponse.json({
      current,
      forecast,
      historical,
      alerts,
    });
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}

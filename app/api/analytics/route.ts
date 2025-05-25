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
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");
    const period = searchParams.get("period") || "month"; // week, month, year

    // Get user's farms if no specific farmId provided
    const userFarms = await prisma.farm.findMany({
      where: {
        userId: session.user.id,
        ...(farmId ? { id: farmId } : {}),
      },
      select: {
        id: true,
        name: true,
        location: true,
      },
    });

    if (userFarms.length === 0) {
      return NextResponse.json(
        { error: "No farms found for this user" },
        { status: 404 }
      );
    }

    const farmIds = userFarms.map((farm) => farm.id);

    // Calculate date ranges based on period
    const today = new Date();
    let periodStartDate: Date;
    let comparisonStartDate: Date;

    switch (period) {
      case "week":
        periodStartDate = new Date(today);
        periodStartDate.setDate(today.getDate() - 7);
        comparisonStartDate = new Date(periodStartDate);
        comparisonStartDate.setDate(periodStartDate.getDate() - 7);
        break;
      case "year":
        periodStartDate = new Date(today);
        periodStartDate.setFullYear(today.getFullYear() - 1);
        comparisonStartDate = new Date(periodStartDate);
        comparisonStartDate.setFullYear(periodStartDate.getFullYear() - 1);
        break;
      default: // month
        periodStartDate = new Date(today);
        periodStartDate.setMonth(today.getMonth() - 1);
        comparisonStartDate = new Date(periodStartDate);
        comparisonStartDate.setMonth(periodStartDate.getMonth() - 1);
        break;
    }

    // Get current soil data
    const currentSoilData = await prisma.soilData.findMany({
      where: {
        farmId: {
          in: farmIds,
        },
        timestamp: {
          gte: periodStartDate,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Get previous period soil data for comparison
    const previousSoilData = await prisma.soilData.findMany({
      where: {
        farmId: {
          in: farmIds,
        },
        timestamp: {
          gte: comparisonStartDate,
          lt: periodStartDate,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Get ML recommendations for accuracy calculations
    const recommendations = await prisma.mLRecommendation.findMany({
      where: {
        soilData: {
          farmId: {
            in: farmIds,
          },
          timestamp: {
            gte: periodStartDate,
          },
        },
      },
      include: {
        soilData: {
          select: {
            farmId: true,
          },
        },
      },
    });

    // Calculate overall soil health score
    const calculateSoilHealth = (data: any[]) => {
      if (data.length === 0) return 0;

      let score = 0;

      // pH (optimal range 6.0-7.5)
      const avgPh = data.reduce((sum, d) => sum + d.pH, 0) / data.length;
      if (avgPh >= 6.0 && avgPh <= 7.5) score += 25;
      else if ((avgPh >= 5.5 && avgPh < 6.0) || (avgPh > 7.5 && avgPh <= 8.0))
        score += 20;
      else score += 10;

      // NPK combined score
      const avgN = data.reduce((sum, d) => sum + d.nitrogen, 0) / data.length;
      const avgP = data.reduce((sum, d) => sum + d.phosphorus, 0) / data.length;
      const avgK = data.reduce((sum, d) => sum + d.potassium, 0) / data.length;

      const nScore = avgN >= 30 && avgN <= 60 ? 10 : avgN >= 20 ? 7 : 3;
      const pScore = avgP >= 20 && avgP <= 40 ? 10 : avgP >= 15 ? 7 : 3;
      const kScore = avgK >= 150 && avgK <= 250 ? 10 : avgK >= 100 ? 7 : 3;

      score += nScore + pScore + kScore;

      // Moisture (optimal range 50-70%)
      const avgMoisture =
        data.reduce((sum, d) => sum + d.moisture, 0) / data.length;
      if (avgMoisture >= 50 && avgMoisture <= 70) score += 25;
      else if (
        (avgMoisture >= 40 && avgMoisture < 50) ||
        (avgMoisture > 70 && avgMoisture <= 80)
      )
        score += 20;
      else score += 10;

      // Temperature (optimal range 18-30°C)
      const avgTemp =
        data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
      if (avgTemp >= 18 && avgTemp <= 30) score += 20;
      else if (
        (avgTemp >= 15 && avgTemp < 18) ||
        (avgTemp > 30 && avgTemp <= 35)
      )
        score += 15;
      else score += 5;

      return score;
    };

    // Calculate overall soil health scores
    const currentHealthScore = calculateSoilHealth(currentSoilData);
    const previousHealthScore = calculateSoilHealth(previousSoilData);
    const healthChange = currentHealthScore - previousHealthScore;

    // Calculate parameter averages and trends for current period
    const calculateParameterStats = () => {
      if (currentSoilData.length === 0) return [];

      const parameters = [
        { id: "1", parameter: "pH", unit: "", decimals: 1 },
        { id: "2", parameter: "nitrogen", unit: "ppm", decimals: 0 },
        { id: "3", parameter: "phosphorus", unit: "ppm", decimals: 0 },
        { id: "4", parameter: "potassium", unit: "ppm", decimals: 0 },
        { id: "5", parameter: "moisture", unit: "%", decimals: 0 },
        { id: "6", parameter: "temperature", unit: "°C", decimals: 1 },
      ];

      return parameters.map((param) => {
        const currentValue =
          currentSoilData.reduce(
            (sum, d) => sum + Number(d[param.parameter as keyof typeof d]),
            0
          ) / currentSoilData.length;

        const previousValue =
          previousSoilData.length > 0
            ? previousSoilData.reduce(
                (sum, d) => sum + Number(d[param.parameter as keyof typeof d]),
                0
              ) / previousSoilData.length
            : 0;

        const change = currentValue - previousValue;
        const changePercent =
          previousValue > 0
            ? ((currentValue - previousValue) / previousValue) * 100
            : 0;

        // Determine if this is within optimal range
        let optimal = false;
        switch (param.parameter) {
          case "pH":
            optimal = currentValue >= 6.0 && currentValue <= 7.5;
            break;
          case "nitrogen":
            optimal = currentValue >= 30 && currentValue <= 60;
            break;
          case "phosphorus":
            optimal = currentValue >= 20 && currentValue <= 40;
            break;
          case "potassium":
            optimal = currentValue >= 150 && currentValue <= 250;
            break;
          case "moisture":
            optimal = currentValue >= 50 && currentValue <= 70;
            break;
          case "temperature":
            optimal = currentValue >= 18 && currentValue <= 30;
            break;
        }

        return {
          id: param.id,
          parameter: param.parameter,
          currentValue: Number(currentValue.toFixed(param.decimals)),
          previousValue: Number(previousValue.toFixed(param.decimals)),
          change: Number(change.toFixed(param.decimals)),
          changePercent: Number(changePercent.toFixed(1)),
          trend: changePercent >= 0 ? "up" : "down",
          optimal,
        };
      });
    };

    // Calculate farm performance metrics
    const calculateFarmPerformance = () => {
      return userFarms.map((farm) => {
        // Get soil data for this farm
        const farmCurrentData = currentSoilData.filter(
          (d) => d.farmId === farm.id
        );
        const farmPreviousData = previousSoilData.filter(
          (d) => d.farmId === farm.id
        );

        // Calculate soil health score for this farm
        const soilHealth = Math.round(calculateSoilHealth(farmCurrentData));
        const previousSoilHealth = Math.round(
          calculateSoilHealth(farmPreviousData)
        );
        const soilHealthChange = soilHealth - previousSoilHealth;

        // Calculate recommendation accuracy (mock data as this would be complex)
        const farmRecommendations = recommendations.filter(
          (r) => r.soilData.farmId === farm.id
        );
        // In a real system, you would compare recommendations against actual outcomes
        const recommendationAccuracy =
          farmRecommendations.length > 0
            ? 85 + Math.floor(Math.random() * 10)
            : 90;

        // Calculate device reliability (mock data)
        const deviceReliability = 95 + Math.floor(Math.random() * 5);

        return {
          id: farm.id,
          name: farm.name,
          soilHealth,
          previousSoilHealth,
          soilHealthChange,
          recommendationAccuracy,
          deviceReliability,
        };
      });
    };

    // Generate insights based on soil data
    const generateInsights = () => {
      const insights = [];
      const soilTrends = calculateParameterStats();

      // Soil Health Insight
      if (healthChange > 0) {
        insights.push({
          id: "1",
          title: "Improving Soil Health",
          description: `Your overall soil health score has improved by ${healthChange.toFixed(
            1
          )}% in the last ${period}. Continue maintaining current practices.`,
          priority: "high",
        });
      } else if (healthChange < 0) {
        insights.push({
          id: "1",
          title: "Declining Soil Health",
          description: `Your overall soil health score has decreased by ${Math.abs(
            healthChange
          ).toFixed(
            1
          )}% in the last ${period}. Review your soil management practices.`,
          priority: "high",
        });
      }

      // Parameter-specific insights
      soilTrends.forEach((trend) => {
        if (Math.abs(trend.changePercent) > 5) {
          // Only add insights for significant changes
          const direction = trend.trend === "up" ? "increased" : "decreased";
          const priority =
            !trend.optimal || Math.abs(trend.changePercent) > 15
              ? "medium"
              : "low";

          insights.push({
            id: String(insights.length + 2),
            title: `${
              trend.parameter.charAt(0).toUpperCase() + trend.parameter.slice(1)
            } ${trend.trend === "up" ? "Increase" : "Decrease"}`,
            description: `${
              trend.parameter.charAt(0).toUpperCase() + trend.parameter.slice(1)
            } has ${direction} by ${Math.abs(
              trend.changePercent
            )}% in the last ${period}. ${
              trend.optimal
                ? "This is within the optimal range."
                : "This is outside the optimal range."
            }`,
            priority,
          });
        }
      });

      // Ensure we have at least 3 insights
      if (insights.length < 3) {
        // Add generic insight about NPK if not already covered
        const npkTrend = soilTrends.find(
          (t) =>
            (t.parameter === "nitrogen" ||
              t.parameter === "phosphorus" ||
              t.parameter === "potassium") &&
            t.optimal
        );

        if (npkTrend && !insights.some((i) => i.title.includes("NPK"))) {
          insights.push({
            id: String(insights.length + 2),
            title: "Optimal NPK Levels",
            description:
              "Your NPK levels are within optimal ranges, supporting healthy crop growth and yield potential.",
            priority: "low",
          });
        }
      }

      return insights;
    };

    // Return aggregated data
    return NextResponse.json({
      overallHealth: {
        score: Math.round(currentHealthScore),
        previousScore: Math.round(previousHealthScore),
        change: healthChange.toFixed(1),
        changePercent: previousHealthScore
          ? ((healthChange / previousHealthScore) * 100).toFixed(1)
          : "0",
      },
      soilTrends: calculateParameterStats(),
      farmPerformance: calculateFarmPerformance(),
      soilData: currentSoilData.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      insights: generateInsights(),
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

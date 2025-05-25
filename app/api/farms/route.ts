import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for creating a farm
const createFarmSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  size: z.number().positive().optional(),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  soilType: z.string().optional(),
  climate: z.string().optional(),
  elevation: z.number().positive().optional(),
  imageUrl: z.string().optional(),
});

// GET handler for fetching all farms of the user
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

    // Get farms with counts
    const farms = await prisma.farm.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
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

    // Calculate stats
    const totalFarms = farms.length;
    const totalArea = farms.reduce(
      (total, farm) => total + (farm.size || 0),
      0
    );
    const totalDevices = farms.reduce(
      (total, farm) => total + farm._count.devices,
      0
    );
    const averageSize = totalFarms > 0 ? totalArea / totalFarms : 0;

    return NextResponse.json({
      farms,
      stats: {
        totalFarms,
        totalArea,
        totalDevices,
        averageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching farms:", error);
    return NextResponse.json(
      { error: "Error fetching farms" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new farm
export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = createFarmSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    // Extract data and ensure proper types
    const {
      name,
      location,
      latitude,
      longitude,
      size = 0, // Default to 0 if undefined
      description,
      address,
      country,
      region,
      soilType,
      climate,
      elevation,
      imageUrl,
    } = validationResult.data;

    // Create the farm
    const farm = await prisma.farm.create({
      data: {
        name,
        location,
        latitude,
        longitude,
        size, // Now properly typed as number
        description,
        address,
        country,
        region,
        soilType,
        climate,
        elevation,
        imageUrl,
        userId: user.id,
      },
    });

    return NextResponse.json(farm, { status: 201 });
  } catch (error) {
    console.error("Error creating farm:", error);
    return NextResponse.json({ error: "Error creating farm" }, { status: 500 });
  }
}

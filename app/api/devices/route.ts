import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for creating a device
const createDeviceSchema = z.object({
  name: z.string().min(2),
  deviceId: z.string().min(3),
  deviceType: z.enum([
    "SOIL_SENSOR",
    "WEATHER_STATION",
    "IRRIGATION_CONTROLLER",
    "CAMERA",
  ]),
  farmId: z.string().min(1),
  zoneId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).default("INACTIVE"),
  firmwareVersion: z.string().optional(),
  macAddress: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  installationDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

// GET handler for fetching all devices
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
    const deviceType = searchParams.get("deviceType");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {};

    // Only include devices from farms owned by the user
    where.farm = {
      userId: session.user.id,
    };

    if (farmId) {
      where.farmId = farmId;
    }

    if (zoneId) {
      where.zoneId = zoneId;
    }

    if (deviceType) {
      where.deviceType = deviceType;
    }

    if (status) {
      where.status = status;
    }

    const devices = await prisma.device.findMany({
      where,
      include: {
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
        _count: {
          select: {
            soilData: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Error fetching devices" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new device
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = createDeviceSchema.safeParse(body);

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

    // Verify that the deviceId is unique
    const existingDevice = await prisma.device.findUnique({
      where: {
        deviceId: data.deviceId,
      },
    });

    if (existingDevice) {
      return NextResponse.json(
        { error: "A device with this ID already exists" },
        { status: 409 }
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

    // Create the device
    const device = await prisma.device.create({
      data: {
        ...data,
        lastActive: new Date(),
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json(
      { error: "Error creating device" },
      { status: 500 }
    );
  }
}

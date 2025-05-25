import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First find all farms associated with this user
    const userFarms = await prisma.farm.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    const farmIds = userFarms.map((farm) => farm.id);

    // Then find the device that belongs to one of these farms
    const device = await prisma.device.findFirst({
      where: {
        id: params.id,
        farmId: {
          in: farmIds,
        },
      },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ device });
  } catch (error) {
    console.error("Error fetching device:", error);
    return NextResponse.json(
      { error: "Failed to fetch device" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First find all farms associated with this user
    const userFarms = await prisma.farm.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    const farmIds = userFarms.map((farm) => farm.id);

    // Check if the device exists and belongs to user's farms
    const device = await prisma.device.findFirst({
      where: {
        id: params.id,
        farmId: {
          in: farmIds,
        },
      },
    });

    if (!device) {
      return NextResponse.json(
        {
          error: "Device not found or you do not have permission to delete it",
        },
        { status: 404 }
      );
    }

    // Delete the device
    await prisma.device.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error("Error deleting device:", error);
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, status, firmwareVersion, macAddress } = body;

    // First find all farms associated with this user
    const userFarms = await prisma.farm.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    const farmIds = userFarms.map((farm) => farm.id);

    // Check if the device exists and belongs to user's farms
    const device = await prisma.device.findFirst({
      where: {
        id: params.id,
        farmId: {
          in: farmIds,
        },
      },
    });

    if (!device) {
      return NextResponse.json(
        {
          error: "Device not found or you do not have permission to update it",
        },
        { status: 404 }
      );
    }

    // Update the device
    const updatedDevice = await prisma.device.update({
      where: {
        id: params.id,
      },
      data: {
        name: name !== undefined ? name : undefined,
        status: status !== undefined ? status : undefined,
        firmwareVersion:
          firmwareVersion !== undefined ? firmwareVersion : undefined,
        macAddress: macAddress !== undefined ? macAddress : undefined,
      },
    });

    return NextResponse.json({ device: updatedDevice });
  } catch (error) {
    console.error("Error updating device:", error);
    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { pusherServer } from '@/lib/pusher';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

// Validation schema for device registration
const deviceRegistrationSchema = z.object({
  deviceId: z.string().min(3).max(100),
  name: z.string().min(2).max(100),
  farmId: z.string(),
  deviceType: z.enum(['SOIL_SENSOR', 'WEATHER_STATION', 'IRRIGATION_CONTROLLER', 'CAMERA']),
  batteryLevel: z.number().min(0).max(100).optional(),
  signalStrength: z.number().min(0).max(100).optional(),
  firmwareVersion: z.string().optional(),
  macAddress: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional()
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    
    // Validate request body
    const validationResult = deviceRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify that the farm belongs to the user
    const farm = await prisma.farm.findUnique({
      where: {
        id: data.farmId,
        userId: session.user.id
      }
    });

    if (!farm) {
      return NextResponse.json(
        { error: 'Farm not found or you do not have permission to add devices to this farm' },
        { status: 403 }
      );
    }

    // Check if device already exists
    const existingDevice = await prisma.device.findUnique({
      where: { deviceId: data.deviceId }
    });

    if (existingDevice) {
      return NextResponse.json(
        { error: 'A device with this ID already exists' },
        { status: 409 }
      );
    }

    // Create the device
    const device = await prisma.device.create({
      data: {
        deviceId: data.deviceId,
        name: data.name,
        status: 'INACTIVE',
        lastActive: new Date(),
        batteryLevel: data.batteryLevel || 100,
        signalStrength: data.signalStrength || 100,
        farmId: data.farmId,
        deviceType: data.deviceType,
        firmwareVersion: data.firmwareVersion,
        macAddress: data.macAddress,
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
      }
    });

    // Trigger real-time update
    await pusherServer.trigger(`farm-${data.farmId}`, 'device-added', {
      device
    });

    return NextResponse.json(
      { device, message: 'Device registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Device registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during device registration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { deviceId, farmId, deviceName, batteryLevel, signalStrength, data } = body;

    // Validate required data
    if (!deviceId || !farmId || !data || !data.soilData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the device exists in our database
    let device = await prismaClient.device.findFirst({
      where: { deviceId }
    });

    // If device doesn't exist, register it
    if (!device) {
      device = await prismaClient.device.create({
        data: {
          deviceId,
          name: deviceName || `NPK Sensor ${deviceId}`,
          deviceType: 'SOIL_SENSOR',
          status: 'ACTIVE',
          batteryLevel: batteryLevel || 100,
          signalStrength: signalStrength || 100,
          farm: { connect: { id: farmId } }
        }
      });
    } else {
      // Update device status
      await prismaClient.device.update({
        where: { id: device.id },
        data: {
          status: 'ACTIVE',
          lastActive: new Date(),
          batteryLevel,
          signalStrength
        }
      });
    }

    // Save soil data
    const { nitrogen, phosphorus, potassium, moisture, temperature, pH } = data.soilData;
    
    const soilData = await prismaClient.soilData.create({
      data: {
        nitrogen,
        phosphorus,
        potassium,
        moisture,
        temperature,
        pH,
        device: { connect: { id: device.id } },
        farm: { connect: { id: farmId } },
      }
    });

    // Update last reading timestamp for the farm
    await prismaClient.farm.update({
      where: { id: farmId },
      data: { lastReading: new Date() }
    });

    // Trigger real-time update via Pusher
    await pusherServer.trigger(`farm-${farmId}`, 'soil-data-update', {
      deviceId,
      soilData: {
        id: soilData.id,
        nitrogen,
        phosphorus,
        potassium,
        moisture,
        temperature,
        pH,
        timestamp: soilData.createdAt
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Data received successfully',
      deviceId: device.id
    });
  } catch (error) {
    console.error('Error processing device data:', error);
    return NextResponse.json(
      { error: 'Failed to process data' },
      { status: 500 }
    );
  }
}

// Helper function to generate alerts based on soil data
async function generateAlerts(soilData, device) {
  const alerts = [];
  
  // pH level check
  if (soilData.pH < 5.5) {
    alerts.push({
      type: 'LOW_PH',
      message: `Low pH detected (${soilData.pH}) at ${device.name}. Consider applying lime to raise soil pH.`,
      severity: 'WARNING',
      isRead: false,
      userId: device.farm.userId,
      farmId: device.farmId,
      deviceId: device.id,
      soilDataId: soilData.id
    });
  } else if (soilData.pH > 7.5) {
    alerts.push({
      type: 'HIGH_PH',
      message: `High pH detected (${soilData.pH}) at ${device.name}. Consider applying sulfur to lower soil pH.`,
      severity: 'WARNING',
      isRead: false,
      userId: device.farm.userId,
      farmId: device.farmId,
      deviceId: device.id,
      soilDataId: soilData.id
    });
  }
  
  // Moisture check
  if (soilData.moisture < 20) {
    alerts.push({
      type: 'LOW_MOISTURE',
      message: `Low soil moisture (${soilData.moisture}%) detected at ${device.name}. Consider irrigation.`,
      severity: 'CRITICAL',
      isRead: false,
      userId: device.farm.userId,
      farmId: device.farmId,
      deviceId: device.id,
      soilDataId: soilData.id
    });
  }
  
  // Create all alerts
  if (alerts.length > 0) {
    await prismaClient.alert.createMany({
      data: alerts
    });
    
    // Trigger real-time notifications
    await pusherServer.trigger(`user-${device.farm.userId}`, 'new-alerts', {
      count: alerts.length,
      alerts
    });
  }
  
  return alerts;
} 
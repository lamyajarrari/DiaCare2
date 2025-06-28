import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const machines = await prisma.machine.findMany({
      include: {
        _count: {
          select: {
            faults: true,
            alerts: true,
            maintenanceSchedule: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(machines);
  } catch (error) {
    console.error("Error fetching machines:", error);
    return NextResponse.json(
      { error: "Failed to fetch machines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      inventoryNumber,
      department,
      status,
      lastMaintenance,
      nextMaintenance,
    } = body;

    // Validate required fields
    if (!name || !inventoryNumber || !department) {
      return NextResponse.json(
        { error: "Missing required fields: name, inventoryNumber, and department are required" },
        { status: 400 }
      );
    }

    // Check if inventory number already exists
    const existingMachine = await prisma.machine.findUnique({
      where: { inventoryNumber },
    });

    if (existingMachine) {
      return NextResponse.json(
        { error: "A machine with this inventory number already exists" },
        { status: 400 }
      );
    }

    // Generate a unique ID
    const machineId = `MACH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create machine
    const machine = await prisma.machine.create({
      data: {
        id: machineId,
        name,
        inventoryNumber,
        department,
        status: status || "Active",
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null,
      },
    });

    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    console.error("Error creating machine:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A machine with this inventory number already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create machine" },
      { status: 500 }
    );
  }
}

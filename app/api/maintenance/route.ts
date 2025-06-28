import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Construire la requête avec filtrage optionnel par statut
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }

    const maintenance = await prisma.maintenanceSchedule.findMany({
      where: whereClause,
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true,
            department: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Parse tasks JSON field
    const formattedMaintenance = maintenance.map((item) => ({
      ...item,
      tasks: JSON.parse(item.tasks),
    }));

    return NextResponse.json(formattedMaintenance);
  } catch (error) {
    console.error("Error fetching maintenance schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance schedule" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { machineId, type, tasks, dueDate, status } = body;

    // Validate required fields
    if (!machineId || !type || !tasks || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create maintenance schedule
    const maintenance = await prisma.maintenanceSchedule.create({
      data: {
        machineId,
        type,
        tasks: JSON.stringify(tasks),
        dueDate,
        status: status || "Pending",
      },
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...maintenance,
        tasks: JSON.parse(maintenance.tasks),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating maintenance schedule:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance schedule" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields: id and status" },
        { status: 400 }
      );
    }

    // Update maintenance schedule status
    const maintenance = await prisma.maintenanceSchedule.update({
      where: { id },
      data: { 
        status,
        completedAt: status === "Completed" ? new Date() : null
      },
      include: {
        machine: {
          select: {
            name: true,
            inventoryNumber: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...maintenance,
        tasks: JSON.parse(maintenance.tasks),
      }
    );
  } catch (error) {
    console.error("Error updating maintenance schedule:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance schedule" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    const where = patientId ? { patientId } : {};

    const faults = await prisma.fault.findMany({
      where,
      include: {
        patient: {
          select: {
            name: true,
            patientId: true,
          },
        },
        machine: {
          select: {
            name: true,
            inventoryNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(faults);
  } catch (error) {
    console.error("Error fetching faults:", error);
    return NextResponse.json(
      { error: "Failed to fetch faults" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      faultType,
      description,
      downtime,
      rootCause,
      correctiveAction,
      status,
      patientId,
      machineId,
    } = body;

    // Validate required fields
    if (!date || !faultType || !description || !patientId || !machineId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create fault
    const fault = await prisma.fault.create({
      data: {
        date,
        faultType,
        description,
        downtime: downtime || "",
        rootCause: rootCause || "",
        correctiveAction: correctiveAction || "",
        status: status || "Pending",
        patientId,
        machineId,
      },
      include: {
        patient: {
          select: {
            name: true,
            patientId: true,
          },
        },
        machine: {
          select: {
            name: true,
            inventoryNumber: true,
          },
        },
      },
    });

    return NextResponse.json(fault, { status: 201 });
  } catch (error) {
    console.error("Error creating fault:", error);
    return NextResponse.json(
      { error: "Failed to create fault" },
      { status: 500 }
    );
  }
}

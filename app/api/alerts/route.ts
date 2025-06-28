import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAlertEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    // Construire la requête avec filtrage optionnel par rôle et statut
    const whereClause: any = {};
    
    if (role) {
      whereClause.messageRole = role;
    }
    if (status) {
      whereClause.status = status;
    }

    const alerts = await prisma.alert.findMany({
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
        timestamp: "desc",
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      messageRole,
      type,
      requiredAction,
      priority,
      machineId,
      status,
    } = body;

    // Validate required fields
    if (!message || !type || !requiredAction || !priority || !machineId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get machine details for email
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      select: {
        name: true,
        department: true,
      },
    });

    // Create alert
    const alert = await prisma.alert.create({
      data: {
        message,
        messageRole: messageRole || "",
        type,
        requiredAction,
        priority,
        timestamp: new Date(),
        status: status || "active",
        machineId,
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

    // Send email notification
    try {
      const emailResult = await sendAlertEmail({
        message,
        messageRole: messageRole || "",
        type,
        requiredAction,
        priority,
        machineId,
        machineName: machine?.name,
        department: machine?.department,
      });

      if (!emailResult.success) {
        console.warn('Email notification failed:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the alert creation if email fails
    }

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields: id and status" },
        { status: 400 }
      );
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: parseInt(id) },
      data: { status },
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

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

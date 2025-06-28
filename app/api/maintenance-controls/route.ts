import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { 
  createMaintenanceControl, 
  getAllMaintenanceControls,
  sendMaintenanceNotifications 
} from "@/lib/maintenance-notifications";
import { sendMaintenanceEmail } from "@/lib/email";

export async function GET() {
  try {
    const controls = await getAllMaintenanceControls();
    return NextResponse.json(controls);
  } catch (error) {
    console.error("Error fetching maintenance controls:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance controls" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      machineId,
      technicianId,
      controlType,
      controlDate,
      notes,
    } = body;

    // Validate required fields
    if (!machineId || !technicianId || !controlType || !controlDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate control type
    const validControlTypes = ['3_months', '6_months', '1_year'];
    if (!validControlTypes.includes(controlType)) {
      return NextResponse.json(
        { error: "Invalid control type. Must be one of: 3_months, 6_months, 1_year" },
        { status: 400 }
      );
    }

    // Get technician and machine details for email
    const technician = await prisma.user.findUnique({
      where: { technicianId },
      select: {
        name: true,
        email: true,
      },
    });

    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      select: {
        name: true,
        inventoryNumber: true,
        department: true,
      },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician not found" },
        { status: 404 }
      );
    }

    if (!machine) {
      return NextResponse.json(
        { error: "Machine not found" },
        { status: 404 }
      );
    }

    // Create maintenance control
    const control = await createMaintenanceControl({
      machineId,
      technicianId,
      controlType,
      controlDate: new Date(controlDate),
      notes,
    });

    // Send immediate email notification to the technician
    try {
      const emailResult = await sendMaintenanceEmail({
        technician: {
          name: technician.name,
          email: technician.email,
        },
        controls: [{
          id: control.id,
          machine: {
            name: machine.name,
            inventoryNumber: machine.inventoryNumber,
            department: machine.department,
          },
          controlType,
          nextControlDate: control.nextControlDate,
          isOverdue: control.nextControlDate < new Date(),
        }],
      });

      if (emailResult.success) {
        console.log(`Maintenance control email sent successfully to ${technician.name} (${technician.email})`);
      } else {
        console.warn('Maintenance control email failed:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending maintenance control email:', emailError);
      // Don't fail the control creation if email fails
    }

    return NextResponse.json(control, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance control:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance control" },
      { status: 500 }
    );
  }
} 
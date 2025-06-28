import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      inventoryNumber,
      department,
      status,
      lastMaintenance,
      nextMaintenance,
    } = body;

    // Validate that the machine exists
    const existingMachine = await prisma.machine.findUnique({
      where: { id },
    });

    if (!existingMachine) {
      return NextResponse.json(
        { error: "Machine not found" },
        { status: 404 }
      );
    }

    // Check if inventory number is being changed and if it already exists
    if (inventoryNumber && inventoryNumber !== existingMachine.inventoryNumber) {
      const duplicateMachine = await prisma.machine.findUnique({
        where: { inventoryNumber },
      });

      if (duplicateMachine) {
        return NextResponse.json(
          { error: "A machine with this inventory number already exists" },
          { status: 400 }
        );
      }
    }

    // Update machine
    const updatedMachine = await prisma.machine.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(inventoryNumber && { inventoryNumber }),
        ...(department && { department }),
        ...(status && { status }),
        ...(lastMaintenance && { lastMaintenance: new Date(lastMaintenance) }),
        ...(nextMaintenance && { nextMaintenance: new Date(nextMaintenance) }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedMachine);
  } catch (error) {
    console.error("Error updating machine:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A machine with this inventory number already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update machine" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';

    // Validate that the machine exists
    const existingMachine = await prisma.machine.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            faults: true,
            alerts: true,
            maintenanceSchedule: true,
            maintenanceControls: true,
          },
        },
      },
    });

    if (!existingMachine) {
      return NextResponse.json(
        { error: "Machine not found" },
        { status: 404 }
      );
    }

    // Check if machine has related data
    const hasRelatedData = 
      existingMachine._count.faults > 0 ||
      existingMachine._count.alerts > 0 ||
      existingMachine._count.maintenanceSchedule > 0 ||
      existingMachine._count.maintenanceControls > 0;

    if (hasRelatedData && !forceDelete) {
      const relatedItems = [];
      if (existingMachine._count.faults > 0) relatedItems.push(`${existingMachine._count.faults} fault(s)`);
      if (existingMachine._count.alerts > 0) relatedItems.push(`${existingMachine._count.alerts} alert(s)`);
      if (existingMachine._count.maintenanceSchedule > 0) relatedItems.push(`${existingMachine._count.maintenanceSchedule} maintenance schedule(s)`);
      if (existingMachine._count.maintenanceControls > 0) relatedItems.push(`${existingMachine._count.maintenanceControls} maintenance control(s)`);

      return NextResponse.json(
        { 
          error: `Cannot delete machine "${existingMachine.name}" because it has related data: ${relatedItems.join(', ')}. Please remove or reassign these items first.`,
          details: {
            faults: existingMachine._count.faults,
            alerts: existingMachine._count.alerts,
            maintenanceSchedule: existingMachine._count.maintenanceSchedule,
            maintenanceControls: existingMachine._count.maintenanceControls,
          },
          canForceDelete: true
        },
        { status: 400 }
      );
    }

    // If force delete is enabled, delete all related data first
    if (forceDelete && hasRelatedData) {
      console.log(`🗑️ Force deleting machine "${existingMachine.name}" and all related data...`);
      
      // Delete related data in the correct order (respecting foreign key constraints)
      if (existingMachine._count.alerts > 0) {
        await prisma.alert.deleteMany({
          where: { machineId: id }
        });
        console.log(`   - Deleted ${existingMachine._count.alerts} alert(s)`);
      }

      if (existingMachine._count.maintenanceControls > 0) {
        await prisma.maintenanceControl.deleteMany({
          where: { machineId: id }
        });
        console.log(`   - Deleted ${existingMachine._count.maintenanceControls} maintenance control(s)`);
      }

      if (existingMachine._count.maintenanceSchedule > 0) {
        await prisma.maintenanceSchedule.deleteMany({
          where: { machineId: id }
        });
        console.log(`   - Deleted ${existingMachine._count.maintenanceSchedule} maintenance schedule(s)`);
      }

      if (existingMachine._count.faults > 0) {
        await prisma.fault.deleteMany({
          where: { machineId: id }
        });
        console.log(`   - Deleted ${existingMachine._count.faults} fault(s)`);
      }
    }

    // Delete machine
    await prisma.machine.delete({
      where: { id },
    });

    const message = forceDelete 
      ? `Machine "${existingMachine.name}" and all related data deleted successfully`
      : "Machine deleted successfully";

    return NextResponse.json({ 
      message,
      deletedMachine: {
        id: existingMachine.id,
        name: existingMachine.name,
        inventoryNumber: existingMachine.inventoryNumber,
      },
      forceDeleted: forceDelete,
      deletedData: forceDelete ? {
        faults: existingMachine._count.faults,
        alerts: existingMachine._count.alerts,
        maintenanceSchedule: existingMachine._count.maintenanceSchedule,
        maintenanceControls: existingMachine._count.maintenanceControls,
      } : null
    });
  } catch (error) {
    console.error("Error deleting machine:", error);
    return NextResponse.json(
      { error: "Failed to delete machine" },
      { status: 500 }
    );
  }
} 